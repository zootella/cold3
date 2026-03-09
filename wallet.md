
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

## Store exports: three groups to review

After the refactor, credentialStore exports 13 wallet-related items. They fall into three groups:

**Database credential** — `wallet`, `walletProve1`, `walletProve2`, `walletRemove`. Same shape as name, password, totp. These belong here, no question.

**Wagmi connection state** — `connectedAddress`, `isConnected`, `loadWagmi`. The point of this refactor. These belong here too — the store owns wagmi's lifecycle now.

**Wagmi operation passthroughs** — `wagmiConnectInjected`, `wagmiConnectWalletConnect`, `wagmiDisconnect`, `wagmiSignMessage`, `wagmiGetBlockNumber`, `wagmiReadContract`. These are thin wrappers that just forward to `wagmi_core.*(_wagmiConfig, ...)`. The first four are used by WalletPanel during connect/prove flows. The last two (`wagmiGetBlockNumber`, `wagmiReadContract`) are only used by `onQuotes`, which isn't a credential concern at all — it's Ethereum price and block number display.

The credentialStore is becoming a pass-through layer for raw wagmi_core calls, which is different from what the rest of the store does. Every other exported method is a meaningful credential operation (check a name, sign in, enroll TOTP). These are just "call this library function with the config I'm holding."

Worth thinking about: should the wagmi passthroughs stay here, move to a separate wagmiStore, or should WalletPanel get direct access to the config somehow? The third group especially — onQuotes could live in a completely different component that has nothing to do with credentials.

## Relationship to other credential work

This is a UX polish task, not a data integration task. The wallet credential is already fully integrated into credential_table, credentialStore, and the API endpoint. The wagmi-to-store refactor improves the user experience (no re-initialization on navigation) but doesn't change any security properties, data flow, or API surface.

It's independent of the OTP and OAuth integration work described in credential.md, and independent of the future event-row/watermark refactor. Can be done in any order relative to those.

# Code comments and notes

Hi claude, please don't delete the sections below. They're here for us to review, use parts of if necessary. When the time is right, I'll delete them.

```js
/*
ttd december2025, notes from the wallet demo from before we moved this here to the credential panel

for coding and smoke testing right now, all this state is in a component
in a moment, we'll refactor much of this from here into a pinia store
that way, wagmi will be loaded once the first time a navigated tab needs it
and stay around as the user clicks away from, and back to, components that use it
ok but some things to think about in preparation for that refactor:
(1) some stuff, like wagmi configured and loaded modules, go in the store
(2) other stuff, like uri, like anything related to a previously completed or half completed and abandoned connection or proof flow, should *not* go in the store--here, we want the user's navigation away to cancel and reset the abandoned operation
(3) right now we are calling _wagmiUnwatch onUnmounted; in a store that won't happen we'll just keep it going until the whole tab is torn down
(4) we've got some pinia stores intended to begin with the server render as part of universal rendering; other stores are intended and coded so that they don't do anything on a server render portion, and work entirely on the client. for this web3 wallet stuff, we want that--client only

wagmi's own architecture intends one single instance that lives with the tab
and state related to an in-progress connect and prove flow is baked in
so, we're not going to try to separate that. as claude explains:

Wagmi's architecture:
 - Single config, single set of connector instances, single WebSocket to relay
 - In-flight operations (pending session proposals, pending signature requests) are bound to that config
 - No clean "abort and reset" API - operations complete on their own (timeout, user action) or stay pending

The simple path forward:
 - Move everything wagmi-related into the store: imports, config, connection state, flow state, all of it
 - Component becomes a pure view layer - reads store state, calls store methods, shows appropriate UI
 - If user navigates away mid-QR-code and comes back, component re-mounts and displays the same QR code from store
   state
 - The pending WalletConnect session proposal is still alive, user can still scan it
 - If they don't want to, they wait for timeout (5 min) or we could add a "Cancel" that calls disconnect

What this means practically:
 - refUri, refConnectedAddress, refIsConnected, refInstructionalMessage, all button states - all move to store
 - onInjectedConnect, onWalletConnect, onDisconnect, onProve - all move to store
 - _wagmiConfig, _wagmiUnwatch - move to store (and we stop unwatching on unmount since store persists)
 - Component just does: const store = usePage2Store(); await store.load() then renders based on store state

One nuance: The onDisplayUri callback in connector config can directly set store.uri since it's a closure over
store state. No subscription pattern needed.
*/
```

```html
<!--
<p>
	Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code> in <code>{{refQuotesDuration}}ms</code>.
	There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.
	<Button link :click="onQuotes">Check again</Button>
</p>
-->
```




