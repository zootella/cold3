# brownieless

The plan for the sprint that retires the brownie and the page-held envelope. Three credential proof flows have a gap in the middle — totp between the qr scan and the first code, wallet between minting a nonce and receiving the signature, otp between sending a code and hearing it typed back — and today each keeps something across that gap outside the database: totp and otp as notes in the brownie, the sealed letter in localStorage, and wallet as a sealed envelope the page holds in memory. After this sprint each keeps it in the database, on the event-3 row credential_table already writes or gains at the start of the flow, with the trail carrying the one value a hash can carry. The database becomes the only place that knows what a browser is in the middle of, which is the right shape for serverless code in replicated isolates, where no instance can be trusted to remember anything for the next request.

Nothing about what the flows do for the user changes, and no migration is needed: credential_table's json column and level2's json-path filter already exist, so the whole sprint is code. It is the first of a run of simplifications, ahead of the smaller dog, and it reopens a fork credential.md recorded as decided in August 2026, two days before jsonb arrived and removed the objection that decided it.

The flows appear below from simplest to most involved: totp, then wallet, then otp. Each has the same four parts: how it works today, exactly, in every place its data lands; how it works brownieless; the testing and refactoring steps; and notes worth carrying into the work. The values in every example are one set, minted by icarus itself with Tag, hashText, the validators, and the real keys opened the way the test runner opens them, so where a value recurs it recurs exactly, and where two differ they visibly differ. Strings are quoted and numbers bare, as in the code.

```
Alice, the user                       userTag      '8quOfIYWkS1cmzj6nsgMm'
her browser's cookie                  browserTag   '2hbhlTd8iNjCYWeDIGuvQ'
what the server keeps of it           browserHash  'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA'
her address, the matching form        f0           'alice@example.com'
the form for apis                     f1           'alice@example.com'
the form the user sees                f2           'alice@example.com'
the challenge                         tag          'swrRT6UA0ZiywklAdfya7'
an earlier challenge it replaces      tag          'Pmkw6rA0gstWZSDpuPHU3'
the code we sent                      answer       '4471'
the letter that helps her find it     prefix       'B'
when the challenge started            start        1788557850091
twenty minutes later                  expiration   1788559050091
her authenticator secret              secret       'SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU'
her wallet, the matching form         f0           '0x8ba1f109551bd432803012645ac136ddd64dba72'
the checksummed form for apis         f1           '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
the checksummed face the user sees    f2           '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
the nonce the wallet signs            nonce        'ygJTo9qkhSTeRoUQg44Kx'
the brand in the message              brand        'e.fans'
```

Tags are twenty-one characters of base62. A hash is thirty-two bytes, fifty-two characters of base32, and the same text always hashes the same; a totp secret is twenty bytes, thirty-two characters of base32, a key rather than a hash, which is why hash_text, guarded to the shape of a hash, never holds one. The three forms of an address are one string for email and diverge for a wallet, which is why all three are always shown. Every credential_table row also carries row_tag, row_tick, and hide, filled by the query helpers, and every trail row row_tick and hide the same way. credential_table's event column is a number — 2 mentioned, 3 challenged, 4 validated — spelled out beside each below; a tag style like Challenged. and Validated. is the likely successor when the credential_table pass gets there. The shapes are the hosted database's as of September 4, 2026. otp also writes a ledger row at send, the whole task the lambda returned, and the document leaves it out: nothing reads ledger_table, the row is a record beside the flow rather than a part of it, and a later pass adds many more like it.

**The two sealed shapes.** An envelope is what sealEnvelope makes: a letter object, given an action and an expiration, encrypted under the envelope key into an opaque text the server alone can open, and openEnvelope refuses a letter whose action doesn't match the purpose it was asked for. The brownie is one envelope with the action `'Brownie.'`, whose letter holds a browserHash above a list of notes, each note with a type, an expiration, and an owner; the page parks the text under the localStorage key `brownie`, fetchWorker puts it in the body of every POST, and doorWorker opens it into door.brownie and reseals whatever request code left, answering the page with BrownieSet., BrownieDelete., or nothing. The browserHash is the letter's binding to one browser: sealBrownie stamps it fresh from the request's cookie every time it seals, and openBrownie compares it to the request's browserHash on every open and wipes the notes when they disagree, so a letter transplanted to another browser arrives empty and the response deletes it. That check is the door's, in level2, and every flow relies on it rather than repeating it; the owner on each note is the second binding, and the flow functions check that one themselves, touching only notes whose userTag is the signed-in user's. On the wire and in storage a sealed letter is opaque text; the totp letter below, sealed, is this:

```
'T6AR0y4Adc3Eh4mPZk0JYUSJ277vTduEXEXSUCJlU1xHsuYAJqnLpW0tpppPraXpMtkw3OVFeTBatlLP8f1obopbNPzkm3yuHNe11dddEdVJoMUrxRvYpJBOOJiwZU5vOit0R3qir7Wibb3PQaLniiw3M7SOiXtbap6xaPlXiM7AlZKwKFdZXHE6VM2ReMway0ZGP4a3iiinCaa83JLH2kTqE9nijjnRvMGp9kKZclNIUQknqLfnMPaoNrs2mECuIQzQUZU3swYwn0WzlzZbHfHIezFpzec7mjLvmZ3Q9oxe1YwlIBJpDgRJl2w6daEv7ZxUlifXmBxNZ5IwUCbILJmiuiOpnpUid6R2cDTbVGin9BfKiT3XypiK'
```

It was sealed with the real envelope key on a workstation and carries the dummy values above, bound to a browser that doesn't exist, so it opens to nothing anywhere. The flows below show letters open, as request code sees them, and never the ciphertext again.

**Rules every flow follows after the sprint.**

- The provisional record of a flow is a challenged row, event 3, in credential_table, and hash_text on that row is the browser that started the flow. That is already where a browser hash lives on a credential row — sign-in writes the Browser. row with the browserHash in hash_text, and credentialBrowserGet, the hottest query in the application, reads it back through credential13 — so the rule reads once: on a Browser. row the hash is the browser signed in, and on any event-3 row it is the browser that started the flow. The second step of every flow compares it to the request's browserHash and refuses any other, which is the door's letter binding moved to the one place it matters. credential_table has no browser_hash column, ledger_table and delay_table do, and it does not grow one, because under data-plan.md who and where belong to the ledger. Every challenged row enters credential13, partial on hash_text being non-blank, carrying a value nothing looks up; a b-tree a few thousand entries larger costs storage, not latency.
- The row's start is row_tick, its life is twenty minutes, and both are checked at read. Nothing stores an expiration.
- Provisional rows stay. A finished, abandoned, or expired challenged row is evidence that the user tried to start something, and a later audit wants it. Nothing deletes or scrubs one; row_tick checked at read is what keeps a stale row from acting live. The credential_table pass will decide what a challenged row becomes when the table holds current state, and this sprint makes that easier by having the rows already in place.
- A secret that must be recoverable rides the row's json. A value that only needs a yes-or-no check rides the trail as a hash, in a message the flow already looks up, so it costs no new query. Never cold-call the trail with a question like "does this browser have a code out": that is one query per question for every user, nearly all of whom are mid-nothing, and an early otp design built that way was a pile of such queries. The clue that a flow is in flight comes from credential_table, in the queries Get. already makes; only when a flow exists and the user acts does one trail query validate.
- The page is told exactly what it is told today, and never hash_text. The snapshot is assembled entirely from the database, so the server render paints in-flight flows on first paint, and the second round trip the brownie needed after hydration leaves.
- Each step that read a note or opened an envelope now reads a row: one database read, on the order of a hundred milliseconds, on a path where a human just typed six digits or signed a message. The brownie was built to avoid exactly this — "ephemeral state deserves neither a second database nor Supabase's durability" — and this sprint spends it on purpose, because the database is not a second database, it is the first one.

## totp

### How it works today

totp uses the brownie and credential_table. It uses no page-held envelope and no trail messages.

**Alice asks to enroll an authenticator app.** The page sends `TotpEnroll1.`; no brownie arrived, so the endpoint starts an empty letter. credentialTotpEnroll1 first reads credential_table to confirm she has no enrolled row, then mints a secret and sets one note in the letter, replacing any earlier one of hers. Nothing is written to the database. The letter, as it stands at the end of this request:

```
brownie letter
	browserHash: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA' # the binding: openBrownie empties the notes unless this equals the request's browserHash
	notes:
		- type:       'Totp.'
		  expiration: 1788559050091
		  userTag:    '8quOfIYWkS1cmzj6nsgMm' # the owner: the flow touches only notes whose userTag is the signed-in user's
		  secret:     'SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU' # 20 bytes in base 32; shorter than a 32 byte SHA-256 hash value
```

The response's snapshot carries the enrollment, which attachState's recover step rebuilds from the note; this is what the page draws as a qr code:

```
task.enrollment
	uri:        'otpauth://totp/cold3.cc%3A%40alice%20%5Bw4%5D?secret=SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU&algorithm=SHA1&digits=6&period=30&issuer=cold3.cc'
	identifier: 'w4'
```

If she cancels instead, `TotpClear.` removes the note and the letter is empty.

**She scans the code and types the first one her app shows.** The page sends `TotpEnroll2.` with the code, and the brownie comes with it. credentialTotpEnroll2 reads credential_table again to confirm she still isn't enrolled, finds her note by owner, checks its expiration, validates the code against its secret, and credentialTotpSet hides any earlier enrolled row and writes:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Totp.'
	event:     4 (validated)
	f0_text:   ''
	f1_text:   ''
	f2_text:   ''
	hash_text: '' # we don't put the secret here because hashes in the database are 32 bytes, SHA-256 values
	json:
		secret: 'SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU'
```

Then it removes the note, and the letter is empty. Between the two steps the database knew nothing had happened, and an abandoned enrollment leaves no trace anywhere: the hosted table shows it, every Totp. row at event 4, thirty-seven of them, four visible and the rest hidden by re-enrollments.

### How it works brownieless

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Totp.'
	event:     3 (challenged)
	f0_text:   ''
	f1_text:   ''
	f2_text:   ''
	hash_text: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA' # the browser that started the enrollment
	json: {
		secret: 'SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU'
	}

credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Totp.'
	event:     4 (validated)
	f0_text:   ''
	f1_text:   ''
	f2_text:   ''
	hash_text: ''
	json: {
		secret: 'SSCLAFVSDO6XNPML7JOHL4C2YGERHQUU'
	}
```

No trail messages, since the secret must be recoverable, to validate the first code and to redraw the qr code. The brownie note and letter are gone. The enrollment the page draws is the same object as today, rebuilt from the challenged row's secret on every snapshot, including the server render, so the qr code is on the page at first paint and survives a refresh without the second round trip.

**enroll1** writes the challenged row — the first time the start of an enrollment is recorded anywhere. **enroll2** reads the newest visible challenged row for the user, checks its row_tick against twenty minutes and its hash_text against the request's browserHash, validates the code against its secret, and writes the enrolled row as today; the challenged row stays as it is, outranked by the enrolled one. **recover** reads the same row, gated by its existence, and rebuilds the uri from its secret. **clear** hides it, the house's removal mechanism, and the row remains in the table as evidence. The challenged row and the enrolled row share a json shape, so validation is a copy today and an edit in place once the table holds current state.

### Testing and refactoring steps

The grid tests that walk this flow today are the totp enroll suite — the whole flow from secret to saved enrollment, cancel and wrong code and enrolling twice, notes scoped by owner on a shared browser, and recover for the person who started it — plus two that test the letter itself, "totp in the brownie," and one shared with otp that puts an email, a phone, and an enrollment in one letter. The suite keeps proving the same flow against rows; the two letter tests retire with their subject, and the shared one splits into its two flows.

1. credentialTotpEnroll1 writes the challenged row, hash_text the browserHash and json the secret, and loses its letter parameter. It keeps the read that tosses when she is already enrolled.
2. credentialTotpEnroll2 reads the newest visible challenged row for the user in place of the note, checks row_tick and hash_text, and otherwise runs as today. credentialTotpRecover reads the same row. credentialTotpClear hides it. All three lose the letter parameter; the four gates recover has today become three, since the row's existence replaces the note's.
3. The endpoint's `TotpEnroll1.`, `TotpEnroll2.`, and `TotpClear.` branches stop passing door.brownie, and attachState's enrollment projection asks recover without a letter. The totp query in attachState widens from event 4 to every event, with the code deciding enrolled or in flight; that is the one filter that changes.
4. The totp essay above the functions in level3 is rewritten around rows, and the grid tests follow: the letter tests go, the rest pass a browserHash where they passed a letter, and one new case proves a challenged row from another browser is refused.
5. Smoke, local and deployed: start an enrollment, refresh, and see the qr code on first paint; cancel and see it go; sign in as the same user at a second browser and see an ordinary panel, no qr code; finish the enrollment and see the enrolled row beside the challenged one in the dashboard.

The brownie stays in place through this step, unused by totp, so it can ship alone and soak.

### Additional notes

- Already enrolled is a toss, not an outcome. Both enroll1 and enroll2 read credential_table first and toss with a state error if an enrolled row exists, because the page should never have offered enrollment; that is the programmer-error path on purpose.
- A wrong first code is not rate limited, deliberately. enroll2 answers BadCode. and leaves the challenge standing, since the secret is already on screen in the qr code, so guarding guesses would defend nothing.
- recover has four gates today, and runs on every snapshot for a signed-in user whose browser holds a brownie: a note exists, it has a secret, it isn't expired, and she isn't already enrolled, which would mean she finished elsewhere. The last gate costs one credential_table read, only when a note exists; with rows that read is the one attachState already makes.
- The account name in the uri comes from her Name. credential, so the authenticator entry reads "cold3.cc: @alice [w4]"; a user without a name gets "@anon". A ttd there says to use email later.
- The identifier, w4 here, is the first two characters of a hash of the secret, and the server hands it to the page beside the uri on purpose. The page could derive it while enrolling, since the uri carries the secret, but peeling a secret out of a uri is fiddlier than composing one, nothing on the page parses uris today, and once enrolled the page never sees the secret again and has to be told the identifier anyway, through task.totpIdentifier. So it stays as it is, a convenience the server computes for free in both states.
- A third action exists, TotpValidate., which checks a code against the enrolled row outside enrollment and today only logs that it succeeded, with a ttd saying this is where letting someone in, or elevating for a sudo transaction, would begin. It touches no brownie, so nothing in this sprint changes it, but it is the hook the sudo hour would hang from. The brownie's essay reserved the sudo hour as its next tenant; when it arrives it is a row too, or, once credential_table holds current state, a column on the Browser. row saying until when this browser is elevated, which is what browser_table's abandoned `level` column in data-cleanup.md was reaching for. Either way a database fact, readable by any request and any staff tool, not a note only the elevated browser can present.
- The enrolled row already holds the secret in plaintext, forever, so the challenged row's twenty minutes add nothing to what the dashboard shows. Sealing the secret at rest, on both rows, would be a hardening of its own and applies to the proven row first.

## wallet

### How it works today

wallet uses credential_table and a page-held envelope. It uses no brownie note and no trail messages.

**Alice connects a wallet.** The page sends `WalletProve1.` with the address. credentialWalletProve1 validates it into its three forms and writes the mention before any rule can refuse, so a refused attempt still leaves its trace:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     2 (mentioned)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: ''
	json:      {}
```

Then it reads credential_table twice for the refusal rules, another holder of the address and her own proven wallets against the limit, and refuses here rather than after she has signed. Passing, it mints the nonce and seals the envelope:

```
envelope letter
	nonce:       'ygJTo9qkhSTeRoUQg44Kx'
	address:     '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	browserHash: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA'     # prove2 refuses an envelope from another browser
	action:      'ProveWallet.'
	expiration:  1788559050091
```

And writes the challenge:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     3 (challenged)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: ''
	json:      {}
```

The response carries the nonce and the sealed envelope. The page holds both in memory only, embeds the nonce in the SIWE message it builds, and asks the wallet to sign it. A refresh here drops the page's memory of the nonce and the envelope and orphans any signature request the wallet was showing, while wagmi reconnects the wallet on its own from notes it keeps in localStorage; she is connected again and starts the proof over with one click. Nothing outside the page was created that a restart would orphan, which is the difference from totp and otp, and why the envelope never needed to survive a refresh.

**She signs.** The page sends `WalletProve2.` with the message, the signature, and the envelope. credentialWalletProve2 opens the envelope, checks its expiration, that its browserHash is the request's, and that its address is the one being claimed, then verifies the signature around the nonce it holds: offline for an ordinary wallet, and through the chain provider for a contract wallet. credentialWalletSet runs the refusal rules again, since minutes have passed, and writes the proof:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     4 (validated)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: ''
	json:      {}
```

The envelope is discarded with the response; nothing the page held survives.

### How it works brownieless

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     2 (mentioned)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: ''
	json:      {}

credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     3 (challenged)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA'     # new: the browser that started the proof
	json:
		nonce: 'ygJTo9qkhSTeRoUQg44Kx'                                   # new

credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Ethereum.'
	event:     4 (validated)
	f0_text:   '0x8ba1f109551bd432803012645ac136ddd64dba72'
	f1_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	f2_text:   '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
	hash_text: ''
	json:      {}
```

No trail messages. The envelope is gone, and prove1 returns the nonce alone. Of the envelope's five fields only the nonce needed a home: the address is the row's f triad, the browserHash is hash_text, the action is the row's type and event, and the expiration is row_tick plus twenty minutes. The nonce is not a secret from anyone, since the page embeds it in the message the wallet displays before signing, so it rides json rather than the trail; a trail message would prove we issued it, but the row proves that already, and it would be a second read where the row is one.

**prove1** writes the challenged row with the nonce in json and the browserHash in hash_text. **prove2** parses the nonce out of the signed message and finds the visible challenged row for the user and address that carries it — by the nonce, never by newest, so two tabs proving the same address each find their own challenge, as they do today — then checks the row's row_tick against twenty minutes and its hash_text against the request's browserHash, and verifies the signature around that nonce. The page carries nothing sealed at all: it embeds the nonce in the message it signs, and the server finds the challenge by who, what, and which. A replayed proof after success meets the validated row and the refusal rules, as today.

On the page, the nonce and the envelope are local variables inside one function in WalletPanel, never a ref and never storage, so the change there is that prove1 stops returning an envelope and prove2 stops sending one. A refresh behaves exactly as it does now: the function's stack is gone, wagmi reconnects, and she starts over with a click. The row's survival is left deliberately unused — the snapshot never carries wallet challenges — because offering to resume would mean reconciling the challenged address with whatever account the wallet reconnected as, for the sake of one saved click.

### Testing and refactoring steps

The grid tests that walk this flow today are the wallet prove suite: the whole flow from nonce to saved proof with a real signature, the envelope tying step two to the browser and the address step one was for, only the connected wallet's own signature over our own nonce proving anything, and a refused flow never minting a nonce. The second becomes the row tying step two to the browser and the address; the rest pass a browserHash where they passed an envelope.

1. credentialWalletProve1 puts the nonce on the challenged row's json and the browserHash in its hash_text, and returns the nonce alone.
2. credentialWalletProve2 loses its envelope parameter, parses the nonce from the message with viem's parseSiweMessage, finds the challenged row by user, address, event 3, and json nonce, checks row_tick and hash_text, and otherwise runs as today.
3. WalletPanel stops destructuring an envelope from prove1's answer and stops passing one to prove2; credentialStore.walletProve2 drops the parameter. The `'ProveWallet.'` envelope action leaves.
4. The grid tests follow, with two new cases: two challenges for one address, each proving with its own nonce, the second meeting WalletAlreadyProven.; and Alice starting a proof, signing out, and Carol at the same browser finding no challenge of hers.
5. Smoke, local and deployed: prove a wallet end to end; refresh between the steps and start over; open two tabs and prove in each.

Independent of the other two flows, so it can land in either order beside them.

### Additional notes

- The proof is SIWE. The page builds an EIP-4361 message with viem's createSiweMessage, through wagmiStore, around the nonce the server minted, and the wallet signs the whole text after showing it: domain, address, statement, uri, version, chain, nonce, issued-at, and expiration. prove2 parses and validates it with viem's siwe helpers, checking the domain, the nonce, the address, and the message's own time window, then recovers the signer with verifyMessage. A contract wallet holds no key to recover, so its proof goes to the chain through Alchemy for EIP-1271, and the code asks the chain something trivial first to tell a declined proof from an unreachable provider.
- The message carries its own expiration, twenty minutes, the same as the envelope's, and the server enforces both: defense in depth around one lifetime.
- The refusal rules run at both steps, two reads each, another holder of the address and her own wallets against the limit of two: at prove1 so she is never sent to sign for a proof we would decline, and again inside credentialWalletSet at prove2, because the minutes she spent signing are long enough for another tab or another account to change the answer.
- The mention is written before the refusal rules and the challenge after them, so a refused attempt leaves its trace and only a permitted one carries a nonce.
- refProving in WalletPanel holds the connection still while a signature request is up, so a live account switch can't change the address under it, and an Expired. outcome makes the page disconnect.
- The audit of the change, property by property. Nothing gets weaker, and one thing gets stricter: today, if Alice starts a proof and signs out, and Carol signs in at the same browser within twenty minutes, Carol can submit Alice's envelope with a signature from the wallet and the proof is written for Carol. Whoever produced the signature controls the wallet, so it was never a hole, but the challenge did belong to Alice; with rows the lookup is scoped by the signed-in user, so Carol finds nothing and starts her own.

```
the nonce is authentic       today: sealed under the envelope key            after: exists only as a row the server wrote
for this address             letter.address must match, else toss            the lookup is by user, address, and nonce
from this browser            letter.browserHash must equal the request's     hash_text must equal the request's
fresh                        letter.expiration, sealed                       row_tick plus twenty minutes
for this purpose             action 'ProveWallet.'                           type_text 'Ethereum.' and event 3
for this user                not checked                                     the lookup is scoped by the signed-in user
replay after success         WalletAlreadyProven. from the refusal rules     the same
the page is told             the nonce and an opaque envelope                the nonce
the page can send            any envelope; only ours opens                   any nonce; only one we wrote for this user, address, and browser is found
```

- One implementation rule to hold if the two-query snapshot ever happens: the projection stays explicit per type, so a challenged Ethereum row's json never rides to the page by accident. The nonce is not secret, but the habit is the point.

## otp

### How it works today

otp uses credential_table, trail_table, and the brownie. It uses no page-held envelope.

**Alice asks to prove alice@example.com.** The page sends `OtpSendTurnstile.` with the address and a provider letter, which the endpoint maps to Twilio.; no brownie arrived, so the endpoint starts an empty letter. credentialOtpSend runs in four commented steps.

*Claim.* It reads credential_table for a proven holder of the address, then writes the mention, on every send, even one about to be refused as Held. because someone else holds the address:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     2 (mentioned)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: ''
	json:      {}
```

*Permit.* It reads the trail for one message within five days, and what comes back is a count of the codes this address has had:

```
trail read, within five days
	'OTP opened challenge: address alice@example.com'     # the count decides the hard limit of twenty-four a day, the soft limit of two back to back before a one-minute cooldown, and the code length, four digits for the first code in five days and six after
```

*Compose.* It mints the tag and the answer, derives the prefix letter from the tag, and composes the message: subject `Code B 4471 for e.fans`, the text with the warning after it, and the html.

*Send and record.* It calls the lambda, which hands the message to Twilio and returns the whole task. Then, in this order: it adds the note to the letter, first removing any earlier live note of hers to the same address; it writes the trail messages in one call; and it writes the challenged row. The letter at the end of the request:

```
brownie letter
	browserHash: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA'     # the binding: openBrownie empties the notes unless this equals the request's browserHash
	notes:
		- type:       'Email.'
		  expiration: 1788559050091
		  tag:        'swrRT6UA0ZiywklAdfya7'
		  answer:     '4471'
		  start:      1788557850091
		  userTag:    '8quOfIYWkS1cmzj6nsgMm'                          # the owner
		  address:
			ok:   true
			f0:   'alice@example.com'
			f1:   'alice@example.com'
			f2:   'alice@example.com'
			type: 'Email.'
```

The trail messages, three when an earlier live challenge to the same address is being replaced and two otherwise. The trail stores the hash of each, never the message; every row in the hosted table carries expiration 0 and json {}:

```
trail written
	'OTP closed challenge: tag Pmkw6rA0gstWZSDpuPHU3'      # closes the earlier challenge this one replaces
	'OTP opened challenge: address alice@example.com'      # the message the permit step counts
	'OTP opened challenge: tag swrRT6UA0ZiywklAdfya7'      # proof this challenge was opened
```

The challenged row:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     3 (challenged)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: ''
	json:
		provider: 'Twilio.'
```

The response's snapshot carries the live challenge for the page to draw an enter box, projected from the note with the answer left out:

```
task.otps, one entry per live challenge
	- tag:   'swrRT6UA0ZiywklAdfya7'
	  start: 1788557850091
	  address:
		ok:   true
		f0:   'alice@example.com'
		f1:   'alice@example.com'
		f2:   'alice@example.com'
		type: 'Email.'
```

**She types a guess.** The page sends `OtpEnter.` with the tag and the guess, and the brownie comes with it. credentialOtpEnter finds the note by tag, then reads the trail's three tag messages in one call:

```
trail read, within twenty minutes
	'OTP opened challenge: tag swrRT6UA0ZiywklAdfya7'      # must exist
	'OTP closed challenge: tag swrRT6UA0ZiywklAdfya7'      # must not
	'OTP guessed wrong: tag swrRT6UA0ZiywklAdfya7'         # must number fewer than four
```

It refuses anyone but the note's owner with SignedOut., and reads credential_table once more for a holder, closing the challenge with Held. if another user proved the address meanwhile. Then it compares the guess to the note's answer.

A wrong guess writes one trail message and leaves the note for the next try, answering Wrong. with the guesses left:

```
trail written
	'OTP guessed wrong: tag swrRT6UA0ZiywklAdfya7'
```

The fourth wrong guess, a Held. finding, and a right guess all close the challenge the same way, one trail message and the note removed:

```
trail written
	'OTP closed challenge: tag swrRT6UA0ZiywklAdfya7'
```

A right guess then calls credentialOtpValidated, which reads for a holder again, reads for a visible challenged row of hers to this address, and writes the proof:

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     4 (validated)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: ''
	json:      {}
```

The note is gone from the letter, and the snapshot in the same response no longer lists the challenge, so the enter box goes.

**What the page does with all this.** On every page render, on the server, credentialStore.load sends `Get.`, and attachState answers with the whole picture from credential_table: eight queries for a signed-in user, one for the Browser. row by hash and one per type by user, including the Email. and Phone. rows at every event. From door.brownie it adds `task.otps`, the tag, start, and address of each live challenge with the answer left out, and `task.enrollment`, the qr uri rebuilt from the totp note's secret. But the server render cannot see localStorage, so the page's first paint never shows an in-flight flow; after hydration, app.vue's second onMounted asks the store whether the browser holds a brownie, and only then sends a second `Get.` carrying it, and OtpEnterList and TotpPanel fill in a beat later.

### How it works brownieless

```
credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     2 (mentioned)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: ''
	json:      {}

credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     3 (challenged)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: 'LS3EXO6W6XTR6N6FYZJAY56WBDOV2XHPJSSF2I2BRUAKWLCJANBA'     # new: the browser that started the challenge
	json:
		provider: 'Twilio.'
		tag:      'swrRT6UA0ZiywklAdfya7'                                # new; the start is row_tick, and the answer is in the trail

credential_table
	user_tag:  '8quOfIYWkS1cmzj6nsgMm'
	type_text: 'Email.'
	event:     4 (validated)
	f0_text:   'alice@example.com'
	f1_text:   'alice@example.com'
	f2_text:   'alice@example.com'
	hash_text: ''
	json:      {}
```

Trail messages at send, the three of today and one new one:

```
trail written
	'OTP closed challenge: tag Pmkw6rA0gstWZSDpuPHU3'
	'OTP opened challenge: address alice@example.com'
	'OTP opened challenge: tag swrRT6UA0ZiywklAdfya7'
	'OTP answer: tag swrRT6UA0ZiywklAdfya7 answer 4471'    # new: at enter the guess is hashed into this same message; a row found means it's right
```

The brownie note and letter are gone. task.otps is the same shape as today, built from the challenged rows instead of the notes, with each challenge's start read from row_tick. The challenged row is missing exactly two things the note has — the tag and the answer — and everything else the note carried is a copy of a column the row already has: its start is row_tick, its expiration row_tick plus twenty minutes, its owner user_tag, its type type_text, and its address the f triad. So the row gains the tag in json and the browser in hash_text, and the answer goes to the trail as a hash, where the check it needs is a yes or a no, and where a code never sits in credential_table for anyone scrolling the dashboard to read.

**Send, after.** The four steps run as today with two differences at the end: the challenged row carries the tag and provider in json and the browserHash in hash_text, and the trail gets the answer message beside the three it already gets. No note is added to anything. Challenged rows written before this sprint carry no tag, so they never read as live.

**Enter, after.** The page sends `OtpEnter.` with the tag and the guess, and nothing else; the endpoint resolves the signed-in user as today. Then credentialOtpEnter, in order:

1. **Find the challenged row by tag**, a json-path filter on event-3 rows, with an expression index the day a real query arrives, per jsonb.md. By tag alone, not by owner, so the housemate case below still lands on SignedOut. Not found, or row_tick older than twenty minutes: Expired.
2. **Browser.** hash_text must equal the request's browserHash. This is the door's binding check moved to the one place it matters: a tag typed at another browser gets Expired., which is what a transplanted letter produces today by arriving empty.
3. **Owner.** user_tag must be the signed-in user, else SignedOut., without spending a guess. Same rule, same outcome as today.
4. **Read the trail**, one call, four hashes where today there are three:

```
trail read, within twenty minutes
	'OTP opened challenge: tag swrRT6UA0ZiywklAdfya7'      # redundant now: the row found in step 1 is the proof the challenge was opened; may stay or leave
	'OTP closed challenge: tag swrRT6UA0ZiywklAdfya7'      # must not exist
	'OTP guessed wrong: tag swrRT6UA0ZiywklAdfya7'         # must number fewer than four
	'OTP answer: tag swrRT6UA0ZiywklAdfya7 answer 4471'    # new: the guess hashed into the answer message; found means the guess is right
```

   Closed present or four wrong: Expired., as today.
5. **Holder.** One credential_table read, as today: if another user proved this address while the challenge was live, write closed and answer Held.
6. **Correct means the fourth hash was found.** Right: write closed, then credentialOtpValidated as today, which reads for a holder again and for a visible challenged row of hers, then writes the validated row. Wrong: write guessed-wrong, compute the lives left; none left means write closed and Expired.; otherwise Wrong. with the count. No branch has a note to remove, because the closed trail message is the whole closing.

**What the snapshot must know about closed challenges.** The brownie removed a note the instant its challenge closed, so the enter box vanished with it. A row does not vanish. A resend supersedes naturally, since credentialOtpGet already keeps only the newest row per address; validation supersedes, since event 4 outranks 3; expiration is row_tick plus twenty minutes, checked at read; removal hides every row. Two closings leave no mark on the row: guesses exhausted, and Held. at enter. The trail knows both, because enter wrote the closed message, so the snapshot asks it — one trailGetAny over the tags of the challenges that look live, made only when any do, which is minutes per month. The evidence row stays untouched, and the trail answers the question it already records.

**The snapshot pays nothing new for the signal.** Get. already runs on every page render, on the server, with its eight queries, and the challenged rows already come back in the Email. and Phone. queries, which read every event and already drive the event the page shows. Surfacing a live challenge is projecting the tag out of the newest challenged row's json, and its start from row_tick, when it is under twenty minutes old, inside a collapse that already tracks the newest row per rank. So the query count on page load stays where it is, the mounted follow-up's second round trip leaves, and the enter boxes are on the page at first paint.

### Testing and refactoring steps

The grid tests that walk this flow today are the otp suite near the top of grid.js — sanity, multiple addresses in one letter, expiry, three wrong then right and four wrong exhausting, a replacement code killing the previous, an attacker replaying the envelope getting no more guesses, the hard limit, the soft limit, code length by history, a correct guess closing on the trail, the shared letter with totp, and "otp in the brownie" — and the "otp into credential" suite lower down: lifecycle rows for the signed-in user, a challenge belonging to who started it, a held address refusing everyone else, two users' challenges to one address coexisting with the enter-time claim check, and a removed address not resurrected by a late code. All of them keep proving the same rules against rows. "Multiple addresses in one letter" becomes two challenged rows; "two users' challenges coexist in one letter" becomes two rows; the replayed-envelope test retires with its subject and is replaced by a tag typed at another browser hearing Expired.; the letter tests retire.

1. credentialOtpSend puts the tag beside the provider in the challenged row's json and the browserHash in its hash_text, writes the answer message to the trail beside the three it writes, stops touching a letter, and loses the parameter. The replacement of an earlier live challenge to the same address stays as it is, a closed message on the trail; credentialOtpGet keeping only the newest row per address is what supersedes it in the snapshot.
2. credentialOtpEnter runs the six steps above: the row by tag, browser, owner, the four-hash trail read, holder, then the guess by the fourth hash. It loses the letter parameter and every line that filtered notes.
3. attachState projects task.otps from the Email. and Phone. rows it already reads — the newest challenged row per address with a tag and a row_tick under twenty minutes — and asks the trail which of those have closed, in one call, only when any look live. Its letter parameter goes, and with it the endpoint's door.brownie arguments on `Get.`, `OtpSendTurnstile.`, and `OtpEnter.`.
4. The grid tests follow, as listed above.
5. Smoke, local and deployed: send a code, refresh, and see the enter box on first paint; guess wrong and see the count fall; exhaust the guesses and see the box go; send again and enter right; send to email and phone at once and enter both; sign in as the same user at a second browser and see no enter box, and typing the tag there hears Expired.; a housemate signed in at the same browser hears SignedOut.

**The removal.** otp was the brownie's last tenant, so this is where the machinery leaves, in one focused pass after the three moves have soaked.

- Leaves: the brownie section of level2 whole — the essay, brownieRead, brownieHeld, brownieApply, openBrownie, sealBrownie, brownieCheck, and the five-function note vocabulary with its unit test; the carriage in fetchWorker and the command protocol in the response; the open and seal lines in doorWorker and door.brownie itself; the `'Brownie.'` envelope action; the brownie exports in the icarus barrel and the composable; the store's mounted function and its recovering flag; app.vue's second onMounted and the essay explaining why there are two; the "lands a beat later" comments in OtpEnterList and TotpEnrollment; and the two brownie grid tests near the envelope test, which prove the seal and open that no longer exist. A brownie left in some browser's localStorage by the old build stays there inert and opaque; fetchWorker stops reading the key, and a transitional removeItem is optional tidiness.
- Stays: sealEnvelope and openEnvelope, which keep the media upload permission and the lambda's hashed result, signed parameters between our own machines rather than provisional state a browser carries; the browserTag cookie and the Browser. row, the identity the browser does hold; and the trail, doing the work it does today plus the one message this flow adds.
- The deployed smoke is the three flows themselves, as listed in each section, on a fresh browser and on one that still holds an old brownie.

**The record.** credential.md's fork section records the fourth step of the trajectory — table, cookie, letter, row — and this document retires, its reasoning folded into the comments above the rows and the trail messages that hold the state.

### Additional notes

- The trail today, for otp alone, is five messages: one per address that the permit step counts against the rate limits and code length, and four per tag that carry the challenge's lifecycle and its wrong guesses. It is read at send and at enter, never on page load, and its json column, documented as recoverable information beside the one-way hash proof, has no production writer. Its shape is a yes-or-no proof: did this exact message happen inside this horizon. The answer message is the sixth, and it fits that shape exactly.
- The trail's replay defense goes quiet. Today the trail is a necessity because "an attacker could just replay the same valid brownie, guessing sequentially until they hit the correct answer"; a row cannot be replayed, because the row is the state. The opened-tag message goes redundant with it, since the challenged row found by tag is the proof the challenge was opened; it may stay in the read or leave.
- A code behind a hash defends the casual view — the dashboard scrolled, a coworker's phone camera, a screenshot in a support thread — and not the reader with the database and time, since a six-digit code with a known tag falls to enumeration. That is the right size of defense for a cost of zero queries.
- Every outcome name and remedy stays where it is: the housemate entering at someone else's challenge hears SignedOut., a code typed at another browser hears Expired., Held. closes a challenge another user won, and the three closings close the same way.
- The trajectory, for the record: otp's provisional state began in code_table, a dedicated table with functions to count tries; envelopes in cookies eliminated the table; the brownie eliminated the cookies at the end of July 2026 and took otp on August 12; jsonb entered the menu two days later, credential_table took its json column on August 22, and the objection that decided the August fork — a table per type or a widening column set — no longer applied to a json cell on a row that already exists. The row is the fourth step, and the dedicated table is not coming back.
- The two-query snapshot is deferred to its own exploration after the credential_table pass. attachState's eight queries could become two, the Browser. row by hash and then every row for that user through credential1, sifted once per type, with the live challenges falling out for free; written now, the sift would collapse events over ledger-style rows and the pass would rewrite it over current-state rows. credential.md's section on one query with application logic sifting, and the ttd on attachState, hold the idea until then. This sprint changes only what the existing per-type queries project.
- The credential_table pass inherits challenged rows as a fact. data-plan.md asks what replaces mentioned, challenged, and validated once the table holds current state, and offers a column on the live row, a transient thing in the brownie, or a fact recorded only in the ledger. This sprint removes the middle candidate and weakens the third, since a live challenge is state that enter has to read and ledger_table is queried rarely by design. What remains is a row or a column on a row, which is the pass's question.
