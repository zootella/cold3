
(this notes document is part of a set; find them all by searching "otp notes")

# Wallet Authentication System

Proof of Ethereum wallet ownership via cryptographic signature.

## Overview

User connects their wallet (MetaMask, WalletConnect). Server generates a challenge message with a random nonce. User signs the message with their private key. Server verifies the signature proves ownership of the address.

**Key design:** No database table for challenge state. The server seals an encrypted envelope containing the challenge parameters; the page holds it and resubmits with the signature.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ├─ WalletDemo.vue  →  POST /api/wallet                         │
│  ├─ wagmi: injected() for MetaMask                              │
│  └─ wagmi: walletConnect() with QR code                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Nuxt Server                                                    │
│  └─ api/wallet.js: Prove1 (challenge), Prove2 (verify)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  icarus/                                                        │
│  ├─ level0.js: Tag() for nonce generation                       │
│  ├─ level1.js: checkWallet, validateWallet (EIP-55)             │
│  └─ level2.js: sealEnvelope, openEnvelope                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  viem                                                           │
│  └─ verifyMessage(): recovers signer address from signature     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sealed Envelope Pattern

The challenge nonce and message are sealed in an envelope that the page holds between Prove1 and Prove2. No database write needed.

### Prove1: Generate Challenge

```javascript
// site/server/api/wallet.js:12-21
let address = checkWallet(body.address).f0
let nonce = Tag()  // random 21-char string
let message = safefill`Add your wallet with an instant, zero-gas signature of code ${nonce}`

let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {
  message: safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`,
})
return {message, nonce, envelope}
```

### Prove2: Verify Signature

```javascript
// site/server/api/wallet.js:23-51
let letter = await openEnvelope('ProveWallet.', body.envelope, {skipExpirationCheck: true})
if (isExpired(letter.expiration)) return {outcome: 'BadMessage.'}

// Verify envelope contents match submitted values
if (!hasTextSame(letter.message, safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`))
  return {outcome: 'BadMessage.'}

// Verify nonce is in message (prevents message substitution)
if (!message.includes(nonce)) return {outcome: 'BadMessage.'}

// Verify signature with viem
let valid = await verifyMessage({address, message, signature})
if (!valid) return {outcome: 'BadSignature.'}

return {outcome: 'Proven.'}
```

---

## Why No Cookie?

Unlike TOTP, wallet signing doesn't involve page refreshes:

1. User clicks "Connect Wallet"
2. Wallet popup appears (same browser context)
3. User approves connection
4. Page requests signature
5. Wallet popup appears again
6. User signs
7. Page submits signature

The page holds the envelope in memory (a `ref`) for the few seconds between Prove1 and Prove2.

---

## Wallet Connection

**Location:** `site/components/snippet1/WalletDemo.vue:78-101`

Uses wagmi with two connectors:

```javascript
wagmi_core.createConfig({
  chains: [viem_chains.mainnet],
  transports: {
    [viem_chains.mainnet.id]: viem.http(Key('alchemy url, public'))
  },
  connectors: [
    wagmi_connectors.injected(),  // MetaMask, Coinbase Wallet, etc.
    wagmi_connectors.walletConnect({
      projectId: Key('walletconnect project id, public'),
      showQrModal: false,
      onDisplayUri: (uri) => { refUri.value = uri }  // show our own QR
    }),
  ],
})
```

### MetaMask Flow

```javascript
// site/components/snippet1/WalletDemo.vue:147-166
let result = await wagmi_core.connect(_wagmiConfig, {
  connector: wagmi_connectors.injected()
})
refConnectedAddress.value = result.accounts[0]
```

### WalletConnect Flow

```javascript
// site/components/snippet1/WalletDemo.vue:167-201
await wagmi_core.connect(_wagmiConfig, {
  connector: wagmi_connectors.walletConnect({...})
})
// onDisplayUri callback shows QR code
// User scans with mobile wallet
// Connection resolves when approved
```

---

## Signing Flow

**Location:** `site/components/snippet1/WalletDemo.vue:216-252`

```javascript
// Step 1: Get challenge from server
let response1 = await fetchWorker('/api/wallet', {
  body: {action: 'Prove1.', address}
})
let {nonce, message, envelope} = response1

// Step 2: Request signature from wallet
let signature = await wagmi_core.signMessage(_wagmiConfig, {message})

// Step 3: Submit signature for verification
let response2 = await fetchWorker('/api/wallet', {
  body: {action: 'Prove2.', address, nonce, message, signature, envelope}
})
// response2.outcome === 'Proven.'
```

---

## Address Validation

**Location:** `icarus/level1.js:1052-1103`

```javascript
export function validateWallet(raw) {
  let t = raw.trim()

  // Extract 40 hex characters (with or without 0x prefix)
  let r40
  if (t.length == 42 && t.slice(0, 2).toLowerCase() == '0x') r40 = t.slice(2)
  else if (t.length == 40) r40 = t
  else return {ok: false, raw}

  // Validate hex characters
  if (!/^[0-9a-fA-F]+$/.test(r40)) return {ok: false, raw}

  // Apply EIP-55 checksum
  let c = viem_getAddress(('0x'+r40).toLowerCase())

  return {ok: true, f0: c, f1: c, f2: c, raw}
}
```

Returns three address forms (all the same for wallets):
- `f0`: checksummed (canonical)
- `f1`: for API use
- `f2`: for display

---

## Nonce Generation

**Location:** `icarus/level0.js:1046-1095`

```javascript
export function Tag() {
  // 21 base62 characters
  // ~107 billion years to collision
  // crypto.getRandomValues() for security
  return _tagMaker()
}
```

The nonce is embedded in both:
1. The human-readable message the user signs
2. The sealed envelope for server verification

---

## Security Properties

| Property | How |
|----------|-----|
| Replay prevention | Nonce is random, envelope expires in 20 minutes |
| Cross-browser prevention | browserHash embedded in envelope message |
| Address binding | address embedded in envelope message |
| Signature validity | viem.verifyMessage recovers signer, compares to claimed address |
| Envelope tampering | Symmetric encryption with server-only key |

---

## File Index

| Component | File | Lines |
|-----------|------|-------|
| API endpoint | `site/server/api/wallet.js` | 1-53 |
| Envelope seal/open | `icarus/level2.js` | 380-408 |
| Address validation | `icarus/level1.js` | 1052-1103 |
| Nonce generation | `icarus/level0.js` | 1046-1095 |
| Vue component | `site/components/snippet1/WalletDemo.vue` | 1-296 |

---

## Comparison to OTP and TOTP

| Aspect | OTP (code_table) | TOTP | Wallet |
|--------|------------------|------|--------|
| Proves | Control of email/phone | Possession of device | Control of private key |
| Secret | Server generates code | Shared secret in app | User's private key |
| Provisional state | Database row | Cookie with envelope | Memory with envelope |
| Verification | Hash comparison | HMAC-SHA1 | ECDSA signature recovery |
| User action | Type 4-6 digits | Type 6 digits | Click "Sign" in wallet |
| Rate limiting | Per-address | Per-secret | None (envelope expires) |
| Database table | code_table | credential_table | None |
