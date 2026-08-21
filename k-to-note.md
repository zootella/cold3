# k to note

The per-type transformation map for the credential migration: what each type keeps in the k slots today, where each value lands — the new hash_text column or the note — and what the note properties are named. Decisions made here are upstream of the migration files and code edits; credential-migration.md carries the choreography, and its payload map defers to this document once these decisions settle.

## The two destinations ✅

**hash_text** is a new real column: TEXT, '' the blank, holding one 52-character base32 hash when the row is about a thing with a single meaningful hash. Like the k slots, what the hash is of depends on type_text — but unlike them it is one slot, format-locked, and can't widen. The _text suffix is what makes blank possible: a column titled just hash would get the strict 52-character check at level2's title dispatch, refusing the blank that most types need — the same reason hit and ledger carry user_tag_text for tag-or-blank. The hash format check lives at credentialSet's boundary instead: a new core checkHashOrBlank beside checkTagOrBlank, so only a real hash or '' ever fits. The Browser. lookup — the hottest query in the application — filters this column through a plain partial index in the family credential2 through credential4 already prove in production:

```sql
CREATE INDEX credential13 ON credential_table (hide, type_text, hash_text) WHERE hash_text != '';
```

The doctrine call: jsonb.md draws the line at filtering — margins and identity are real columns, always; the payload bag is for keys rarely filtered on. browserHash is the most-filtered value in the application, and was the one value the earlier payload map put in the bag against that line. hash_text sits in the same gray area as the f columns — meaning varies by type, format doesn't — and lands on the margin side of the line for the same reason they do.

**note**, riding in note_json, is the payload bag for everything else: keys read together, rarely filtered on, variable in presence. It is not only for incidentals — as credential types accumulate, something quite official may fit neither the f triad nor hash_text, and it rides in the note. {} is the blank of the cell, an absent key is the blank of a property, and the write side turns null into an absent key.

**One home per value.** A value lives in hash_text or in the note, never both. A reader who wants a Browser. row's browser hash looks in hash_text and nowhere else.

## Password. ✅

Today k1 holds the hash the page computed — passwordHash runs PBKDF2 in the browser and returns 52 base32 characters, the standard hash shape — and k2 holds cycles as text, read back through textToInt. The hash moves to hash_text. The note keeps one property, and cycles becomes a real number. Only event 4 rows exist:

```
type_text: 'Password.'
event: 4
hash_text: 'EXTNMFVLHQJCEFFJHVKDXPUGBSOO4HDQXUHHKMHSB6WKX2PR2CIQ'
note: {cycles: 39}
```

credentialPasswordGet and credentialPasswordSet convert; their read and return shapes ({hash, cycles}) don't change for callers. One test consequence: grid's password tests set placeholder strings like 'hash1', which checkHashOrBlank will refuse — they trade up to real-shaped hashes.

Backfill: `SET hash_text = k1_text, note_json = jsonb_build_object('cycles', k2_text::bigint) WHERE type_text = 'Password.' AND hash_text = '' AND k1_text != ''`.

## Totp. ✅

k1 holds the enrollment secret: 20 random bytes in base32, 32 characters. It is a secret key that generates codes, not a digest of anything — and at 32 characters it fails the hash shape anyway. It stays in the note. Only event 4 rows exist:

```
type_text: 'Totp.'
event: 4
hash_text: ''
note: {secret: 'X7C25WC6CUCF77BO7BOCVUHAZ553UKYA'}
```

credentialTotpGet and credentialTotpSet convert.

Backfill: `SET note_json = jsonb_build_object('secret', k1_text) WHERE type_text = 'Totp.' AND note_json = '{}'::jsonb AND k1_text != ''`.

## Oauth. ✅

Event 4 rows use five slots: k1 provider, k2 identifier, k3 handle, k4 name, k8 the makeText'd auth.js proof slice. Event 3 challenge rows carry only k1. No value here is a hash.

An event 4 validated row, the full linked account:

```
type_text: 'Oauth.'
event: 4
hash_text: ''
note: {
	provider: 'Discord.',
	identifier: '987654321098765432',
	handle: 'alex_dev_42',
	name: 'Alex Dev',
	proof: {account: {…}, profile: {…}, user: {…}}
}
```

An event 3 challenged row, recording we sent the user into the provider's flow:

```
type_text: 'Oauth.'
event: 3
hash_text: ''
note: {provider: 'Discord.'}
```

The proof's top level is always account, profile, and user — the auth.js slice — while everything inside those is the provider's own shape, kept verbatim: real nested json instead of printed text in a text column, its inner nulls preserved (the backfill strips nulls over the scalar keys only, per credential-migration.md). handle and name can arrive null from the provider — Discord and GitHub both do this — and null becomes an absent key.

identifier keeps an expression index, because the claim check filters it with no user_tag in hand and it is near-unique across the table. provider is only ever filtered beside user_tag (the per-user check and the remove, riding credential1) or beside identifier, so it gets no index of its own:

```sql
CREATE INDEX credential14 ON credential_table (hide, type_text, (note_json->>'identifier')) WHERE note_json->>'identifier' IS NOT NULL;
```

credentialOauthSet, credentialOauthGet, credentialOauthChallenge, and credentialOauthRemove convert; the remove is the queryHide whose UPDATE filters a note path.

## Email. and Phone. ✅

The addresses themselves live in the f columns and stay there. Event 2 mention and event 4 validated rows use no k slots; event 3 challenged rows record which provider carried the code in k1.

An event 2 mentioned row — no payload:

```
type_text: 'Email.'
event: 2
hash_text: ''
note: {}
```

An event 3 challenged row, naming the provider that carried the code:

```
type_text: 'Phone.'
event: 3
hash_text: ''
note: {provider: 'Twilio.'}
```

An event 4 validated row — the proof is the row itself, no payload:

```
type_text: 'Email.'
event: 4
hash_text: ''
note: {}
```

credentialOtpChallenged converts; the other otp functions never touched a k slot.

Backfill: `SET note_json = jsonb_build_object('provider', k1_text) WHERE type_text IN ('Email.', 'Phone.') AND note_json = '{}'::jsonb AND k1_text != ''`.

## Browser. ✅

k1 holds browserHash — a true 52-character hash, already guarded by checkHash at every function boundary. It moves to hash_text, and the note is empty. Only event 4 rows exist:

```
type_text: 'Browser.'
event: 4
hash_text: 'J7SRY4JEKVNQF3DSFFDP2J6ECKJBOFEIBIMCZ7RVQNIJL5THSATA'
note: {}
```

credentialBrowserGet's lookup filters hide, type_text, hash_text, and event, riding credential13 — a plain column and a proven index shape, keeping the hottest query in the application off the new json-path machinery entirely. credentialBrowserSet and credentialBrowserRemove convert alongside.

Backfill: `SET hash_text = k1_text WHERE type_text = 'Browser.' AND hash_text = '' AND k1_text != ''`.

## Ethereum. ✅

No k slots are in use — hash_text stays '' and the note stays {} — but this sprint repairs the f columns here, which hold the address improperly today: the checksummed form sits alone in f0 with f1 and f2 blank. The f columns are for forms of an address, so this is the right home, and the decision is to fill the triad by the validate* family's own rules: f0 the lowercased address — the normalization anyone can reproduce without keccak — to match as unique; f1 and f2 both the EIP-55 checksummed form, the formal and display faces. Every event row — 2 mentioned, 3 challenged, 4 validated — carries the complete triad, the same complete-fact duplication Email. rows have. The bulk is negligible: short strings, on the minority path of advanced users who bring wallets at all.

A validated row — mentioned and challenged rows differ only in the event number:

```
type_text: 'Ethereum.'
event: 4
f0: '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359'
f1: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
f2: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
hash_text: ''
note: {}
```

The code side: a validateWallet joins the validate* family, minting v.f0 lowercase and v.f1 = v.f2 checksummed (viem's getAddress supplies the checksum), and the wallet functions consume the v — writes store the triad, the holder and refusal checks match on lowercase f0, and reads hand pages the checksummed face from f2.

The road ahead this positions for: ecosystem neighbors like Doge. or Solana. arrive as new type_text values with their own validate and prove flows — f0 is whatever exact string that type's validate mints for matching — and EVM network variance like Base is proof metadata, not identity: an address is the same address on every EVM chain, so if we ever verify proofs against multiple chains (the smart-contract-wallet corner, where EIP-1271 asks a contract deployed per chain), challenge and validated rows grow note {chain}, absent meaning mainnet. Neither future needs a migration.

Backfill: `SET f0_text = lower(f0_text), f1_text = f0_text, f2_text = f0_text WHERE type_text = 'Ethereum.' AND f1_text = ''` — every SET expression reads the old row, so f1 and f2 receive the checksummed original in the same statement that lowercases f0; idempotent behind the f1 blank guard, which also skips rows the converted code already wrote complete.

## What this changes upstream, once settled

Deltas to credential-migration.md after this document is reviewed: the expansion migration adds hash_text TEXT NOT NULL DEFAULT '' beside note_json, its default temporary scaffolding on the same schedule; the index set becomes one real-column partial index (credential13) plus one expression index (credential14), replacing eight; the EXPLAIN verification's subject shifts to the oauth claim check, since that is where the novel expression-index machinery now lives, while the Browser. lookup rides a shape production already proves; core gains checkHashOrBlank; a validateWallet joins the validate* family and the wallet functions consume it; credentialSet gains hash and note parameters as its k parameters head toward retirement; the survey checks hash_text's two tenants (every Browser. and Password. k1 is 52-character base32) and Ethereum.'s f state (every f0 a 42-character 0x address, every f1 and f2 blank) alongside the casts; and the per-type backfill statements are the sketches above, each idempotent behind its blank-cell guard. How the backfill splits into migration files is an open decision recorded in credential-migration.md.
