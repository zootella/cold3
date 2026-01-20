
(this notes document is part of a set; find them all by searching "otp notes")

# Wallet Authentication System

Proves user controls an Ethereum wallet by signing a challenge message with their private key.

---

## How It Works

1. User connects wallet (MetaMask popup or WalletConnect QR scan)
2. Page sends wallet address to server (Prove1)
3. Server generates random nonce, builds challenge message, seals envelope
4. Page asks wallet to sign the message (user clicks "Sign" in wallet)
5. Page resubmits envelope + signature (Prove2)
6. Server opens envelope, verifies signature proves address ownership

No database table needed—the envelope holds all challenge state. This is the cleanest of the three systems: no codes to send, no secrets to store, just a cryptographic proof.

---

## The Envelope Pattern

Same principle as TOTP, but simpler because the flow is synchronous.

**Prove1:** Server generates a nonce (random 21-char tag), builds a human-readable challenge message containing the nonce, seals an envelope containing: browserHash, wallet address, nonce, and the message. Returns envelope + message to page.

**Signing:** Page asks the wallet to sign the message. User sees the message in their wallet UI—it's readable, they know what they're approving. Wallet returns the signature.

**Prove2:** Page sends envelope + signature + address + nonce + message back. Server opens envelope, verifies nothing was tampered with (the envelope's contents must match what the page claims), verifies the signature using viem's `verifyMessage()`. If the recovered signer matches the claimed address, ownership is proven.

**Why memory, not cookie?** Wallet signing doesn't leave the page. User clicks a button, wallet popup appears, user approves, popup closes, page submits. Takes seconds, no refresh. The envelope lives in a Vue `ref` during this brief window.

---

## Wallet Connection

Two connection methods, both via wagmi:

**Injected (MetaMask, etc.):** Browser extension wallets inject `window.ethereum`. Click connect, popup appears, user approves, page gets address. Fast, no QR code.

**WalletConnect:** For mobile wallets. Server generates a session URI, page displays it as QR code, user scans with phone wallet, approves on phone. Connection happens over a relay—the page and phone wallet don't talk directly.

`WalletDemo.vue` handles both flows, showing the QR only when WalletConnect is chosen.

---

## Signature Verification

Ethereum signatures are powerful: you can recover the signer's address from any signature. This makes verification straightforward.

1. User signs our challenge message (containing a nonce)
2. Server calls viem's `verifyMessage({address, message, signature})`
3. viem recovers the signer address from the signature
4. If recovered address matches claimed address, ownership is proven

No shared secret needed. The user's private key never leaves their wallet—they just prove they have it by signing something unique.

**Why is the message human-readable?** Users see what they're signing in their wallet UI. A clear message like "Add your wallet with an instant, zero-gas signature of code ABC123..." builds trust. They know they're not signing a transaction that could drain their funds.

**Why embed the nonce?** Prevents replay attacks. Even if someone captures a signature, they can't reuse it—the server will generate a different nonce next time.

---

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `Tag()` | level0.js | Generate cryptographic nonce (21 base62 chars) |
| `validateWallet()` | level1.js | Parse address, apply EIP-55 checksum |
| `sealEnvelope()` | level2.js | Encrypt challenge for page to hold |
| `openEnvelope()` | level2.js | Decrypt and verify on resubmission |
| `verifyMessage()` | viem | Recover signer from signature, compare to address |

---

## Security Properties

| Property | Mechanism |
|----------|-----------|
| Replay prevention | Random nonce, 20-minute envelope expiration |
| Cross-browser prevention | browserHash embedded in envelope |
| Address binding | Address embedded in envelope, verified against signature |
| Tamper prevention | Envelope encrypted with server-only key |

---

## Frontend

| Component | Purpose |
|-----------|---------|
| `WalletDemo.vue` | Wallet connection, QR display, signing flow |

---

## Compared to OTP and TOTP

Wallet is the simplest of the three systems:

| | OTP | TOTP | Wallet |
|-|-----|------|--------|
| **What user proves** | Controls email/phone | Has authenticator device | Controls private key |
| **Shared secret** | Code sent to user | Secret scanned into app | None (asymmetric) |
| **Provisional state** | Database row | Cookie with envelope | Memory with envelope |
| **Database table** | code_table | credential_table | None |
| **User action** | Type 4-6 digits | Type 6 digits | Click "Sign" |

Wallet requires no shared secret and no persistent storage for the challenge—just a brief envelope in memory. The cryptographic proof is self-contained in the signature.

---

## Files

- `site/server/api/wallet.js` — endpoint (Prove1, Prove2)
- `icarus/level0.js` — nonce generation
- `icarus/level1.js` — address validation
- `icarus/level2.js` — envelope seal/open
- `site/components/snippet1/WalletDemo.vue` — frontend
