
# Wallet Credential

## Current state

Wallet is a fully integrated credential. The prove flow works end-to-end: WalletPanel.vue connects a wallet (injected or WalletConnect), requests a signature, and the server verifies it and writes a row to credential_table (type `'Ethereum.'`, f0=checksummed address). `credentialStore.wallet` holds the proven address. Remove works. `attachState` includes it. Done.

The two-step prove flow uses an envelope in the request body (not a cookie) because the signing happens in-page via a wallet popup — there's no navigation away, so no need for cookie persistence. This is different from TOTP and OTP, which use cookie-persisted envelopes because the user might refresh mid-enrollment.

## Wagmi state is component-local

Everything wagmi-related lives inside WalletPanel.vue as component-local refs and lets:

- `_wagmiConfig` — wagmi's config object, created in `onMounted` with chain config, Alchemy transport, and two connectors (injected + WalletConnect)
- `_wagmiUnwatch` — the watchConnection handle, cleaned up in `onUnmounted`
- `refConnectedAddress`, `refIsConnected` — connection state from wagmi
- `refUri` — the WalletConnect URI for QR code display
- `refInstructionalMessage` — error/status text shown to the user
- `refConnecting`, `refProving` — flow-in-progress flags for button ghosting
- `viem`, `viem_chains`, `wagmi_core`, `wagmi_connectors` — dynamically imported modules

When the user navigates away from the credential panel, `onUnmounted` fires, the watcher is cleaned up, and all this state is gone. If they navigate back, `onMounted` runs again: modules are re-imported, wagmi is reconfigured, `reconnect` is called to recover any session wagmi saved to localStorage.

This works, but it's wasteful. Wagmi's own architecture intends a single config instance that lives with the tab. We're creating and destroying it on every mount/unmount cycle.

## What belongs in a store vs. what stays in the component

Not everything should move to the store. The split is between persistent tab state and transient flow state.

**Persistent tab state (move to store):** wagmi config, imported modules, the watchConnection subscription, and the reconnected connection state (address, isConnected). These should be created once when first needed and live until the tab closes. No reason to tear them down on navigation.

**Transient flow state (stays in component or resets on mount):** the WalletConnect URI, instructional messages, connecting/proving flags. These represent an in-progress user interaction. If the user navigates away mid-QR-code, the abandoned attempt should not greet them when they come back. The component mounting fresh is the right behavior — it's a natural cancellation.

The tension is that wagmi bakes flow state into its config. A pending WalletConnect session proposal (the thing that generated the URI) lives inside wagmi's connector instance, which lives in the config. You can't cleanly separate "keep the config alive" from "reset the pending proposal." The session proposal has a 5-minute timeout from the relay server, so it will expire on its own, but in the meantime the user might see a stale QR code if we naively persist the URI from the store.

Options:

1. **Clear flow refs on mount.** Store holds config and connection state. Component reads connection state from store but manages its own flow refs. On mount, flow refs start empty regardless of what wagmi's internal state is. If there's a stale session proposal inside wagmi, it times out silently. User sees a clean slate.

2. **Add a cancel.** When the component unmounts, call `disconnect` on any pending WalletConnect session (if wagmi exposes that). Clean separation, but wagmi doesn't have a great API for aborting a pending session proposal — operations complete on their own (timeout, user action) or stay pending.

3. **Don't bother.** The current approach works. The cost is re-importing modules and reconfiguring wagmi on each mount. `wevmDynamicImport()` caches the import, so module loading is fast after the first time. `reconnect` recovers the connection from localStorage. The main waste is creating a new WalletConnect connector (which opens a new WebSocket to the relay), but this is a sub-second operation.

## Two sources of truth, intentionally

`credentialStore.wallet` (database) and wagmi's connection state (browser) are independent and should stay that way.

- A user can have a proven wallet credential with no active wagmi connection. They proved ownership last week; the credential panel shows their address from the database. Wagmi isn't even loaded yet.
- A user can have an active wagmi connection with no proven credential. They just connected MetaMask but haven't clicked "Prove Ownership" yet.
- The two align only during the prove flow: connect (wagmi state) → sign (wagmi state) → verify and save (database state).

The credential panel already handles this correctly. It shows `credentialStore.wallet` as the proven address regardless of wagmi connection state. The editing UI shows wagmi's connection state for the connect/prove buttons.

## Two directions of input

The wallet credential is unusual among credentials because the system receives facts from two independent directions, without the user taking any credential action.

**Up from the database:** the server knows whether this user has a proven wallet address. This is settled history — a signature was verified, a row was written. It arrives via `attachState` on page load, same as every other credential.

**Down from the client:** wagmi, a third-party library running in the browser, knows whether a wallet is currently connected to this page. This is live, volatile state. It can change at any moment — the user switches accounts in MetaMask, disconnects from the extension, or a WalletConnect session times out. It arrives via `watchConnection` callbacks and `reconnect` on mount.

These two inputs are completely independent. The database doesn't know or care what wagmi thinks. Wagmi doesn't know or care what's in the database. They can agree, disagree, or one can be present while the other is absent. The system we build in the middle — the store, the component, the UI logic — has to reconcile these two streams of facts into something coherent for the user and actionable for us.

No other credential has this shape. Browser, Name, Password, and TOTP are all database-only on read — the server tells you what exists, and the client has nothing to add until the user takes an action. Wallet is the one where the client independently contributes state that matters.

## How the real world does this

### Two popups are unavoidable

At the protocol level, connecting a wallet (exposing the address via [`eth_requestAccounts`](https://docs.metamask.io/wallet/reference/json-rpc-methods/eth_requestaccounts/)) and signing a message (proving ownership via [`personal_sign`](https://docs.metamask.io/wallet/reference/json-rpc-methods/personal_sign/)) are separate EIP operations. The wallet will always show two prompts. The UX trend is to chain them back-to-back with no intermediate app screen between them — the signature message itself serves as the user's confirmation since it's human-readable.

For identity-only flows (no transaction, no token approval), most modern sites go straight from connect approval to signature prompt. An intermediate "confirm your address" screen adds friction without adding security. Exception: if the app supports multiple addresses or chains, an intermediate selector screen makes sense.

### Sign-In with Ethereum (SIWE / EIP-4361)

[EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) (finalized as [ERC-4361](https://docs.login.xyz/general-information/siwe-overview/eip-4361)) defines a standard human-readable message format for wallet-based authentication. The user sees something like:

```
example.com wants you to sign in with your Ethereum account:
0xA0Cf...251e

Sign in to Example App

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 65ed4681...
Issued At: 2026-03-08T12:00:00Z
```

Key fields: `domain` (the requesting site — [MetaMask](https://docs.metamask.io/wallet/how-to/sign-data/siwe/) warns if it doesn't match the actual origin), `nonce` (server-generated, prevents replay), `expiration-time` (optional TTL). The [SIWE library](https://docs.siwe.xyz/) and [Ox](https://oxlib.sh/guides/siwe) both provide implementations.

Our current flow does essentially the same thing — nonce from server, message containing nonce, verify signature with [viem](https://viem.sh/docs/actions/public/verifyMessage)'s `verifyMessage` — but with a custom message format rather than the SIWE standard.

### Session-bound identity is the dominant pattern

After signature verification, the server issues a session (cookie or JWT) tied to the proven address. The wallet can disconnect, switch accounts, or be uninstalled — the session remains valid until it expires. The "currently connected address" in the wallet becomes irrelevant after authentication. This is how traditional auth works (you don't re-enter your password on every page load), and it's how identity-focused web3 sites work too.

Our architecture already follows this pattern. `credentialStore.wallet` is the database truth from the session. Wagmi connection state is transient and independent.

### Account switching behavior

When a user switches accounts in MetaMask while the page is open, the provider fires [`accountsChanged`](https://docs.metamask.io/wallet/reference/provider-api/). Sites handle this three ways, in order of how common:

1. **Invalidate session and prompt re-sign** — most secure, most common for identity-critical apps
2. **Show a warning banner** — "Your wallet changed. Sign in again to update your identity"
3. **Ignore it** — the session remains tied to the original proven address

We currently don't handle `accountsChanged` explicitly. Wagmi's `watchConnection` picks up the change and updates `refConnectedAddress`, but the proven credential in the database is unaffected. This is effectively option 3.

### Sites using wallet as identity

This use case is well-established, not exotic:

- [Guild.xyz](https://guild.xyz/) — token-gated community access. Connect + sign to prove address ownership; Guild checks on-chain holdings against the proven address. Explicitly states it cannot perform transactions.
- [Mirror.xyz](https://mirror.xyz/) — publishing platform where your wallet address is your author identity. No email/password account exists.
- [Farcaster](https://www.farcaster.xyz/) — decentralized social protocol. Identity anchored on-chain (Ethereum/OP Mainnet), data off-chain. Onboarding via wallet signature or embedded wallets through [Privy](https://www.privy.io/).
- [Lens Protocol](https://www.lens.xyz/) — social graph where profile NFTs (ERC-721) on Polygon are your identity. Wallet connection proves you own the profile.
- [ENS](https://ens.domains/) — .eth domain names resolve to wallet addresses. Sites use ENS as a human-readable identity layer on top of raw addresses.

### Single connect button replacing separate wallet buttons

We currently have separate "Browser Wallet" and "WalletConnect" buttons. The modern pattern is a single "Connect Wallet" button that opens a modal handling all wallet types. [Reown AppKit](https://reown.com/appkit) (formerly Web3Modal, from the WalletConnect team) provides this — it discovers installed extensions via [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963), offers WalletConnect QR for mobile wallets, and optionally supports social logins via embedded wallets. This is a separate UX question from the credential architecture, but worth noting.

## Relationship to other credential work

This is a UX polish task, not a data integration task. The wallet credential is already fully integrated into credential_table, credentialStore, and the API endpoint. The wagmi-to-store refactor improves the user experience (no re-initialization on navigation) but doesn't change any security properties, data flow, or API surface.

It's independent of the OTP and OAuth integration work described in credential.md, and independent of the future event-row/watermark refactor. Can be done in any order relative to those.
