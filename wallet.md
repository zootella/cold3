
# Wallet Credential

## Current state

Wallet is a fully integrated credential. The prove flow works end-to-end: WalletPanel.vue connects a wallet (injected or WalletConnect), requests a signature, and the server verifies it and writes a row to credential_table (type `'Ethereum.'`, f0=checksummed address). `credentialStore.wallet` holds the proven address. Remove works. `attachState` includes it.

The two-step prove flow uses an envelope in the request body (not a cookie) because the signing happens in-page via a wallet popup — there's no navigation away, so no need for cookie persistence. This is different from TOTP and OTP, which use cookie-persisted envelopes because the user might refresh mid-enrollment.

Wagmi lifecycle lives in `wagmiStore` (Pinia) — config, modules, watchConnection subscription, and reactive connection state (`connectedAddress`, `isConnected`) persist for the tab lifetime. Transient flow state (WalletConnect URI, instructional messages, connecting flag) stays in WalletPanel as component-local refs that reset on mount.

The dev panel (WalletPanel in `components/snippet1/`) is always expanded, showing both layers as status lines: proof (database) and connection (wagmi), each with independent controls. Connect buttons appear only when not connected. `afterConnect(address)` handles the three-way decision after any successful connect: no proof → prove, same wallet proven → noop, different wallet proven → disconnect and message. The address flows as a direct parameter from `connect()`'s return value through the entire chain, not from reactive state.

## Two sources of truth, intentionally

`credentialStore.wallet` (database) and wagmi's connection state (browser) are independent and should stay that way.

- A user can have a proven wallet credential with no active wagmi connection. They proved ownership last week; the credential panel shows their address from the database. Wagmi isn't even loaded yet.
- A user can have an active wagmi connection with no proven credential. Wagmi reconnected from localStorage on mount, but the user hasn't proven yet (or proof was removed while the connection persisted).
- The two align only during the prove flow: connect (wagmi state) → sign (wagmi state) → verify and save (database state).

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

### Session-bound identity is the dominant pattern

After signature verification, the server issues a session (cookie or JWT) tied to the proven address. The wallet can disconnect, switch accounts, or be uninstalled — the session remains valid until it expires. The "currently connected address" in the wallet becomes irrelevant after authentication. This is how traditional auth works (you don't re-enter your password on every page load), and it's how identity-focused web3 sites work too.

Our architecture already follows this pattern. `credentialStore.wallet` is the database truth from the session. Wagmi connection state is transient and independent.

### Sites using wallet as identity

This use case is well-established, not exotic:

- [Guild.xyz](https://guild.xyz/) — token-gated community access. Connect + sign to prove address ownership; Guild checks on-chain holdings against the proven address. Explicitly states it cannot perform transactions.
- [Mirror.xyz](https://mirror.xyz/) — publishing platform where your wallet address is your author identity. No email/password account exists.
- [Farcaster](https://www.farcaster.xyz/) — decentralized social protocol. Identity anchored on-chain (Ethereum/OP Mainnet), data off-chain. Onboarding via wallet signature or embedded wallets through [Privy](https://www.privy.io/).
- [Lens Protocol](https://www.lens.xyz/) — social graph where profile NFTs (ERC-721) on Polygon are your identity. Wallet connection proves you own the profile.
- [ENS](https://ens.domains/) — .eth domain names resolve to wallet addresses. Sites use ENS as a human-readable identity layer on top of raw addresses.

## Event lifecycle in credential_table

credential_table has four event numbers (level3.js line 910): 1 removed, 2 mentioned, 3 challenged, 4 validated. Wallet is the first credential type to use the intermediate events.

### Where each event fires

**Event 2 (mentioned)** — `WalletProve1.`, right after `checkWallet`. The user's browser has told the server "I'm connected to this address." No proof yet, just a claim.

**Event 3 (challenged)** — `WalletProve1.`, after the envelope is sealed. The server has generated a nonce and is sending it back as a challenge. Events 2 and 3 happen in the same request, back-to-back — the user mentioned an address, and the server immediately challenged it.

**Event 4 (validated)** — `WalletProve2.`, after signature verification. `credentialWalletSet` writes this. The user has proven control.

**Event 1 (removed)** — not written as a row. `credentialWalletRemove` calls `queryHide` on all Ethereum rows for this user. The hide mechanism is the removal.

### The hide wrinkle

`credentialWalletSet` (which writes event 4) calls `queryHide` on all existing Ethereum rows for this user before writing the new event 4 row. This hides the event 2 and 3 rows from the same prove flow. `credentialWalletGet` queries `event: 4` only, so intermediate rows never interfere with reads even if they aren't hidden.

If a user starts the flow but never signs (abandons at the signature prompt), the event 2 and 3 rows remain unhidden with no event 4. This is fine — `credentialWalletGet` ignores them. And it's actually useful: you can see that someone tried to prove a wallet but didn't complete.

# Dev panel test scenarios

The dev panel always shows two status lines. The proof line shows the proven address from credential_table or "not proven". The connection line shows the wagmi-connected address with Disconnect, or connect buttons (Injected, WalletConnect) when not connected.

## Happy paths

**(1) Clean slate → injected connect+prove.** Proof: not proven. Connection: connect [Injected] [WalletConnect]. Click Injected. MetaMask pops connect, then immediately sign (afterConnect sees no proof, chains to prove). Server verifies. Both lines update to show the address.

**(2) Clean slate → WalletConnect connect+prove.** Same starting state. Click WalletConnect. QR code appears. Scan with phone wallet. Phone shows sign request (afterConnect chains to prove). Server verifies. Both lines update.

**(3) Proven + connected → Remove.** Both lines show addresses. Click Remove. DB clears, wagmi disconnects. Both lines reset: "not proven" and connect buttons.

**(4) Proven + connected → Disconnect.** Both lines show addresses. Click Disconnect. Connection clears, connect buttons appear. Proof line unchanged — the credential survives disconnection.

**(5) Proven, not connected → reconnect same wallet.** Proof shows address A. Connection shows connect buttons. Click Injected, connect to A. afterConnect sees same address, noop. Connection line updates to A. No signature popup.

**(6) Proven, not connected → connect different wallet.** Proof shows A. Click Injected, connect to B. afterConnect sees mismatch, disconnects B, shows "A different wallet is already proven. Remove it first, then connect and prove the new one." Connection returns to connect buttons.

## Starting states (page load with prior wagmi session in localStorage)

**(7) Wagmi reconnects, no proof.** wagmiStore.load() reconnects from localStorage, but onMounted shaves the stale connection immediately — user never sees the dead-end (none, connected) state. Page loads at clean slate: not proven, connect buttons.

**(8) Wagmi reconnects, proof matches.** Both lines show same address. Everything consistent.

**(9) Wagmi reconnects, proof doesn't match.** Proof: A. Connection: B. Remove clears both. Disconnect clears B only, proof A remains.

## Injected flow departures

**(10) User rejects connect.** MetaMask popup appears, user clicks Cancel. ProviderNotFoundError or UserRejectedRequestError caught. Message shown. Connect buttons remain.

**(11) User rejects sign.** Connect succeeded, afterConnect chained to prove, sign popup appears, user declines. proveConnectedWallet catches the error, disconnects (shaving the connected-but-unproven dead end), shows "Signature request declined." Both lines reset to clean slate.

**(12) Server rejects signature.** Prove flow completes but server returns BadSignature or Expired. Disconnects (same as sign decline — no reason to stay connected after a failed prove), shows message. Both lines reset to clean slate.

**(13) MetaMask account switch mid-flow.** walletProve1 gets nonce for A. MetaMask switches to B before sign popup. signMessage signs with B's key. walletProve2 sends address A but signature is from B. Server rejects — BadSignature.

## WalletConnect flow departures

**(14) User rejects or times out during connect.** QR code shown, user never scans or rejects on phone. Error caught, QR hidden, message shown. Connect buttons remain.

**(15) WalletConnect session expires after connect.** Connected but not yet proven. wagmi fires onChange, isConnected goes false. Connection line flips to connect buttons. User starts over.

## External state changes

**(16) MetaMask disconnect while proof exists.** wagmi fires onChange, connection clears. Proof unchanged. Connection line shows connect buttons.

**(17) MetaMask account switch while proof exists.** Proof shows A, connection shows A. User switches to B in MetaMask. Connection line briefly updates to B, then the live watcher fires `afterAccountChange`, disconnects B, and shows the different-wallet message. Proof line unchanged.

## Known limitations

**(18) Same wallet, different connector.** Proved via Injected, want to use via WalletConnect instead. Must Remove, then reconnect+prove. Re-proving is just one signature.

**(19) Different wallet.** Must Remove current proof, then connect+prove the new one. afterConnect enforces this.

# Next steps

**Consumer UI for WalletPanel** — collapse the dev panel's two status lines into a single coherent view. Probably: proven address (or "Connect Wallet" button), with edit mode for Remove. afterConnect logic and wagmiStore carry over unchanged; purely a template question. Deferred until credential system is stable across all types — the dev panel is a diagnostic tool needed for ongoing integration work.
