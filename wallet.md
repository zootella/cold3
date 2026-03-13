
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

# Connect, prove, and state reconciliation

## The two independent states

**Database proof** (`credentialStore.wallet`) — the server has verified a signature and stored a checksummed address in credential_table. This is the credential. Survives page reloads, different browsers, everything.

**Wagmi connection** (`wagmiStore.isConnected`, `wagmiStore.connectedAddress`) — the browser has a live session with a wallet (MetaMask, WalletConnect, etc.). Transient browser state. Can appear or disappear based on MetaMask settings, localStorage, WalletConnect session expiry. Not a credential.

## What the UI shows in each starting state

The template gates on these two values. When editing:

**No proof, not connected** — connect buttons (Browser Wallet, WalletConnect, Cancel). This is the entry point. Injected connect chains directly into prove. WalletConnect shows QR first, then Prove after connection.

**No proof, connected** — "Connected: 0x..." + Prove + Cancel. Only reachable via WalletConnect (injected auto-proves) or if wagmi reconnected on mount to a previous session.

**Proof exists** — proven address + Remove + Cancel. Connect buttons are not shown. The user must Remove before they can connect a different wallet. This is intentional — it prunes the "proof of A, connect B" branch entirely.

## The 18 → 6 collapse

On paper: wagmi (none/A/B) × db (none/A/B) × action (connect A / connect B) = 18. But most are unreachable or identical:

- **db has proof → connect buttons hidden.** The user can't initiate a connect action when proof exists. They must Remove first, which clears proof AND disconnects wagmi, returning to (none, none). This eliminates 12 of the 18 cells (all rows where db ≠ none).
- **wagmi connected → connect buttons hidden.** When wagmi is connected and no proof exists, the UI shows Prove, not connect buttons. The user can prove or cancel. This eliminates the "wagmi=A, action=connect B" and "wagmi=B, action=connect A" cells.
- **A vs B is relative, not absolute.** "db=A, connect A" and "db=B, connect B" are the same scenario (proof matches). The absolute addresses don't matter, only whether they match.

## Actual test scenarios

### Happy paths

**(1) Clean slate → injected connect+prove.** wagmi: none. db: none. User clicks Browser Wallet. MetaMask pops connect, then immediately sign. Server verifies. Panel collapses, proven address appears. One button click, two wallet popups.

**(2) Clean slate → WalletConnect connect, then prove.** wagmi: none. db: none. User clicks WalletConnect. QR code appears. User scans, wallet connects. UI shows "Connected: 0x..." + Prove. User clicks Prove. Wallet app requests signature. Server verifies. Panel collapses.

**(3) Proof exists → remove.** wagmi: maybe connected, doesn't matter. db: proof of A. User clicks Edit, sees address + Remove + Cancel. Clicks Remove. Server clears credential, wagmi disconnects, panel collapses. Back to clean slate.

### Starting states (what the page looks like before any action)

**(4) Wagmi reconnects on mount, no proof.** wagmi: A (from localStorage/reconnect). db: none. User clicks Edit, sees "Connected: 0x..." + Prove + Cancel. Can prove A, or cancel and ignore.

**(5) Wagmi reconnects on mount, proof matches.** wagmi: A. db: A. User clicks Edit, sees proven address + Remove + Cancel. Wagmi connection is invisible — the proof is what matters. Everything is consistent, nothing to do.

**(6) Wagmi reconnects on mount, proof doesn't match.** wagmi: B. db: A. User clicks Edit, sees proven address of A + Remove + Cancel. Wagmi's connection to B is invisible. If user Removes, both proof and wagmi connection clear.

### Injected flow departures (branches off happy path 1)

**(7) User rejects connect.** MetaMask popup appears, user clicks Cancel. Error caught, instructional message shown, stays on connect buttons.

**(8) User rejects sign.** MetaMask connect succeeds, sign popup appears, user clicks Cancel. `proveConnectedWallet` catches the error, shows message. Since `refConnecting` is still true during prove, template stays on connect buttons view. After the error, `refConnecting` goes false, wagmi is connected, no proof — template flips to "Connected: 0x..." + Prove + Cancel. User can retry prove.

**(9) Server rejects signature.** (Branches off happy path 1 or 2.) Prove flow completes but server returns BadSignature or Expired. Message shown. User can retry.

**(10) MetaMask account switch mid-flow.** User clicks Browser Wallet, connects with A, `walletProve1` gets a nonce for A. MetaMask switches to B before the sign popup. `signMessage` signs with B's key. `walletProve2` sends address B but the envelope contains A's nonce. Server rejects — lands in the BadSignature path of (9). Unlikely but not impossible.

### WalletConnect flow departures (branches off happy path 2)

**(11) User rejects or times out during connect.** QR code shown, user never scans or rejects on phone. Error caught, message shown, stays on connect buttons.

**(12) Session expires after connect, before prove.** User scans QR, wallet connects, UI shows Prove. User walks away. WalletConnect relay session expires (5 min). wagmi fires `onChange`, `isConnected` goes false. Template flips back to connect buttons. User returns, starts over.

**(13) Session expires mid-prove.** User clicks Prove, `walletProve1` succeeds, sign request sent to phone via relay. Session expires before user signs. `signMessage` throws. Message shown. wagmi may report disconnected — template flips to connect buttons. User can start over.

### External state changes (chaos user — wallet changes outside our UI)

**(14) MetaMask disconnect while proof exists.** User proved via injected, then disconnects MetaMask from its own UI. wagmi fires `onChange`, `isConnected` goes false. Proof still in db. User clicks Edit → proven address + Remove + Cancel. Invisible, everything fine. Proof is the credential, not the connection.

**(15) MetaMask account switch while proof exists.** User proved A, switches MetaMask to B. wagmi fires `onChange`, `connectedAddress` becomes B. Template still shows proof of A + Remove + Cancel. Invisible. If user Removes, wagmi disconnects (from B) and proof of A clears.

### Connector switching (known limitations)

**(16) Same wallet, different connector.** User proved A via MetaMask, later wants to use A via WalletConnect instead. Current UI requires Remove, then re-connect+prove via WalletConnect. Two extra steps, but re-proving is just one signature. Known limitation — avoiding the complexity of showing connect buttons when proof exists.

**(17) Different wallet.** User proved A, wants to switch to B. Same as (16): Remove A, then connect+prove B. Remove-first is the only path.

