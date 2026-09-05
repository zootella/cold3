# brownieless

The planning document for a sprint that retires the brownie. Provisional credential state — the totp secret between the qr scan and the first code, and the answer to a live otp challenge — moves out of the sealed letter in localStorage and into the database, beside the credential_table rows that already record the start of each flow, with the trail carrying what a hash can carry. The wallet flow's envelope, the same thing in kind, leaves too, so the database is the one source of truth about what a browser is in the middle of. Nothing about what the flows do for the user changes. What changes is where the truth about an in-flight flow lives: in one place, the database, instead of in a second place the browser carries up with every request.

This is a proposal, scoped and not started, and it is the first sprint of a run of meaningful simplifications, ahead of the smaller dog: each one leaves the codebase shorter and easier to reason about, and this one needs no migration — credential_table's json column and level2's json-path filter already exist, so the whole sprint is code. It reopens a fork credential.md recorded as decided in August 2026, and it says why that is the right thing to do rather than a reversal for its own sake.

The document opens with how the three proof flows touch the data today, exactly, in every place data lands, and the refactor is designed upward from there.

## How it works today

Three credential types have a proof flow with a gap in the middle: totp for an authenticator app, otp for email and phone, and wallet for an Ethereum address. Across that gap each flow keeps something the next step will need, and today there are four places it can land: an envelope the page holds for one flow, a note in the brownie, a row in credential_table, and a message hashed into trail_table. This section shows every one of them for each flow, as the code writes them now. otp also writes a ledger row at send, the whole task the lambda returned, and the document leaves it out: nothing reads ledger_table, the row is a record beside the flow rather than a part of it, and a later pass adds many more like it.

The shapes below are the hosted database's as of September 4, 2026 — which columns are filled, which json keys appear — and the values are dummies minted by icarus itself, with Tag, hashText, the validators, and sealEnvelope opened with the real keys the way the test runner opens them, so that where one value recurs across places it recurs exactly, and where two values differ they visibly differ. Strings are quoted and numbers are bare, as in the code. One set serves every example:

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

Tags are twenty-one characters of base62. A hash is thirty-two bytes, fifty-two characters of base32, and the same text always hashes the same; a totp secret is twenty bytes, thirty-two characters of base32, a key rather than a hash, which is why hash_text, guarded to the shape of a hash, never holds one. The three forms of an address are one string for email and diverge for a wallet, which is why all three are always shown. Every credential_table row also carries row_tag, row_tick, and hide, filled by the query helpers, and every trail row row_tick and hide the same way. credential_table's event column is a number — 2 mentioned, 3 challenged, 4 validated — spelled out beside each below; a tag style like Challenged. and Validated. is the likely successor when the credential_table pass gets there.

**The two sealed shapes.** An envelope is what sealEnvelope makes: a letter object, given an action and an expiration, encrypted under the envelope key into an opaque text the server alone can open, and openEnvelope refuses a letter whose action doesn't match the purpose it was asked for. The brownie is one envelope with the action `'Brownie.'`, whose letter holds a browserHash above a list of notes, each note with a type, an expiration, and an owner; the page parks the text under the localStorage key `brownie`, fetchWorker puts it in the body of every POST, and doorWorker opens it into door.brownie and reseals whatever request code left, answering the page with BrownieSet., BrownieDelete., or nothing. The browserHash is the letter's binding to one browser: sealBrownie stamps it fresh from the request's cookie every time it seals, and openBrownie compares it to the request's browserHash on every open and wipes the notes when they disagree, so a letter transplanted to another browser arrives empty and the response deletes it. That check is the door's, in level2, and every flow relies on it rather than repeating it; the owner on each note is the second binding, and the flow functions check that one themselves, touching only notes whose userTag is the signed-in user's. On the wire and in storage a sealed letter is opaque text; the totp letter below, sealed, is this:

```
'T6AR0y4Adc3Eh4mPZk0JYUSJ277vTduEXEXSUCJlU1xHsuYAJqnLpW0tpppPraXpMtkw3OVFeTBatlLP8f1obopbNPzkm3yuHNe11dddEdVJoMUrxRvYpJBOOJiwZU5vOit0R3qir7Wibb3PQaLniiw3M7SOiXtbap6xaPlXiM7AlZKwKFdZXHE6VM2ReMway0ZGP4a3iiinCaa83JLH2kTqE9nijjnRvMGp9kKZclNIUQknqLfnMPaoNrs2mECuIQzQUZU3swYwn0WzlzZbHfHIezFpzec7mjLvmZ3Q9oxe1YwlIBJpDgRJl2w6daEv7ZxUlifXmBxNZ5IwUCbILJmiuiOpnpUid6R2cDTbVGin9BfKiT3XypiK'
```

It was sealed with the real envelope key on a workstation and carries the dummy values above, bound to a browser that doesn't exist, so it opens to nothing anywhere. The flows below show letters open, as request code sees them, and never the ciphertext again.

### totp, today

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
>> hi claude, you know, i realized that while we're in here, we could prune identifier from this, as teh page can derive it from the secret, you know? i think i had it there during debugging, but it's misleading, we should let the uri exist alone i think. we'll use totpIdentifier() to compute it instad of reading it out of the uri. oh, i guess this means that page code will have to parse the uri either way, which involves calling more stuff and encoding and etc, but that shouldn't be fragile

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

**Facts about totp worth carrying forward.**

- Already enrolled is a toss, not an outcome. Both enroll1 and enroll2 read credential_table first and toss with a state error if an enrolled row exists, because the page should never have offered enrollment; that is the programmer-error path on purpose.
- A wrong first code is not rate limited, deliberately. enroll2 answers BadCode. and leaves the note, since the secret is already on screen in the qr code, so guarding guesses would defend nothing.
- recover has four gates, and runs on every snapshot for a signed-in user whose browser holds a brownie: a note exists, it has a secret, it isn't expired, and she isn't already enrolled, which would mean she finished elsewhere. The last gate costs one credential_table read, only when a note exists.
- The account name in the uri comes from her Name. credential, so the authenticator entry reads "cold3.cc: @alice [w4]"; a user without a name gets "@anon". A ttd there says to use email later.
- The identifier, w4 here, is the first two characters of a hash of the secret, and the server hands it to the page beside the uri on purpose. The page could derive it while enrolling, since the uri carries the secret, but peeling a secret out of a uri is fiddlier than composing one, nothing on the page parses uris today, and once enrolled the page never sees the secret again and has to be told the identifier anyway, through task.totpIdentifier. So it stays as it is, a convenience the server computes for free in both states.
- A third action exists, TotpValidate., which checks a code against the enrolled row outside enrollment and today only logs that it succeeded, with a ttd saying this is where letting someone in, or elevating for a sudo transaction, would begin. It touches no brownie, so nothing in this sprint changes it, but it is the hook the sudo hour would hang from.
- The secret must be recoverable in both states, to validate the first code and to redraw the qr code, so it rides json in both, and the enrolled row already shows that shape.

### otp, today

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

### wallet, today

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

**Facts about wallet worth carrying forward.**

- The proof is SIWE. The page builds an EIP-4361 message with viem's createSiweMessage, through wagmiStore, around the nonce the server minted; prove2 parses and validates it with viem's siwe helpers, checking the domain, the nonce, the address, and the message's own time window, then recovers the signer with verifyMessage. A contract wallet holds no key to recover, so its proof goes to the chain through Alchemy for EIP-1271, and the code asks the chain something trivial first to tell a declined proof from an unreachable provider.
- The message carries its own expiration, twenty minutes, the same as the envelope's, and the server enforces both: defense in depth around one lifetime.
- The refusal rules run at both steps, two reads each, another holder of the address and her own wallets against the limit of two: at prove1 so she is never sent to sign for a proof we would decline, and again inside credentialWalletSet at prove2, because the minutes she spent signing are long enough for another tab or another account to change the answer.
- The mention is written before the refusal rules and the challenge after them, so a refused attempt leaves its trace and only a permitted one carries a nonce.
- On the page, the nonce and the envelope are local variables inside one function in WalletPanel, never a ref and never storage. refProving holds the connection still while a signature request is up, so a live account switch can't change the address under it, and an Expired. outcome makes the page disconnect.
- A refresh drops that function's stack and orphans any open signature request, while wagmi reconnects the wallet from its own notes in localStorage. Nothing external is created that a restart would orphan, unlike totp's app entry or otp's code in an inbox, so starting over costs one click and one nonce.
- Of the envelope's five fields, only the nonce needs a home: the address is the row's f triad, the browserHash is hash_text, the action is the row's type and event, and the expiration is row_tick plus twenty minutes. The row gains one json property, and the response to the page shrinks to the nonce alone.
- prove2 must find the challenge by the nonce in the signed message, never by newest, so two tabs proving the same address each find their own challenge and the second meets WalletAlreadyProven., as today.

### What the page does with all this

On every page render, on the server, credentialStore.load sends `Get.`, and attachState answers with the whole picture from credential_table: eight queries for a signed-in user, one for the Browser. row by hash and one per type by user, including the Email. and Phone. rows at every event. From door.brownie it adds `task.otps`, the tag, start, and address of each live challenge with the answer left out, and `task.enrollment`, the qr uri rebuilt from the totp note's secret. But the server render cannot see localStorage, so the page's first paint never shows an in-flight flow; after hydration, app.vue's second onMounted asks the store whether the browser holds a brownie, and only then sends a second `Get.` carrying it, and OtpEnterList and TotpPanel fill in a beat later.

## What the picture shows, and doesn't

**The otp challenge already has a row**, and the snapshot already carries it: credentialOtpGet returns each address at its highest visible event, so `task.emails` and `task.phones` already tell the page which addresses have a code out. `task.otps` tells it the same thing a second time, with the tag and start tick it needs to draw the enter box. The challenged row is missing exactly two things the note has — the tag and the answer — and one it doesn't, the browser that started it. The note's other fields are copies of columns the row already has: its start is row_tick, its expiration is row_tick plus twenty minutes, and its owner, type, and address are user_tag, type_text, and the f triad.

**The trail already enforces the challenge's lifecycle**, and part of its job is a defense the brownie made necessary: "letter is a convenience; trail is a necessity here — otherwise an attacker could just replay the same valid brownie, guessing sequentially until they hit the correct answer." A sealed letter can be copied and replayed; a row cannot, because the row is the state.

**The totp enrollment has no row at all**, so the abandonment map.md's concerns list wants recorded — "even if Alice never completes the flow — this helps us understand whether Alice, or Twilio, is broken or untrustworthy" — is invisible for totp. It has no provider, but the same question applies: are users generally failing to finish enrollment, and since when.

**The wallet envelope is brownie-like without being in the brownie.** It is provisional state the server authenticates and the page carries, outside the database, and only its not needing to survive a refresh kept it out of the letter: a restart orphans nothing, where totp's restart orphans an app entry and otp's a code in an inbox. The row it belongs beside already exists. Unlike the two notes it is working and bounded, and it joins this sprint on the principle rather than on any defect.

## The principle: no session object

The goal this codebase has held from the start is to build a Web 2.0 application without the Session object — the per-browser bag of state that classic web frameworks hydrate on every request from a store beside the database, or from a sealed cookie, and that becomes a second source of truth about who a browser is and what they are in the middle of. A session drifts from the database, needs its own store or its own crypto, is invisible to a server render that arrives without it, and answers the question "what is going on at this browser" from somewhere the database can't see.

The design here has one thing the browser holds: its identity. The browserTag cookie, httpOnly so page script never reads it, hashed on the server into a browserHash that is durable and deliberately separate from the userTag. The Browser. row in credential_table links that browser to a signed-in user — sign-in writes the row with the browserHash in hash_text, and credentialBrowserGet, the hottest query in the application, reads it back through credential13. Everything else about the user — every credential, every proof, every mention — is a row. The browser identifies itself, and the database says the rest.

The brownie is the one exception to that rule, and its own essay says so: it is "the sealed-session lineage (Rails CookieStore, h3's own useSession)," adopted with three reasoned deviations. It was a small, well-built, tightly bounded session object, admitted because the alternative looked worse at the time. This document is about that alternative no longer looking worse.

## How we got here: a table, then a cookie, then the brownie

Provisional otp state has lived in three places, each simpler than the last. It began as code_table, a dedicated table for challenge state, and the objection to that was structural: a table whose only job is to hold a few scraps for twenty minutes per credential type, or worse, a scattering of rarely-used columns on credential_table itself, one set per type. Envelopes in cookies eliminated the table — the challenge rode sealed in the browser. The brownie eliminated the cookies, unifying totp's envelope and otp's into one sealed letter in localStorage, with per-note owners so housemates could share a browser, and it shipped at the end of July 2026 and took its second tenant, otp, on August 12.

Two days later, jsonb entered the menu. hit_table took a json column on August 18, and credential_table collapsed its k slots into hash_text and a json note on August 22, so by the end of that month every row in the credential system could carry an arbitrary bag of data with no schema change. That is the tool the fork was decided without. The objection to rows was never that rows are the wrong place for provisional state; it was that a row per type needed either a table per type or a widening column set. A json cell on a row that already exists is neither. credential.md's fork record already left the door open — "rows remain available case by case for future state that wants durability or cross-device reach" — and what has changed is that the case-by-case exception is now the better general rule.

## The shape after

The provisional record of a flow is the event-3 row credential_table already has, or gains, with the browser that started it in hash_text and what the note held beside it — in the row's json, or in the trail as a hash where a hash will do, per the section that follows. The examples repeat the ones above, with the same values, and the sprint's changes marked new.

### totp, after

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

No trail rows, since the secret must be recoverable. The brownie note and letter are gone. The enrollment the page draws is the same object as today, rebuilt from the challenged row's secret on every snapshot.

**enroll1** writes the challenged row — the first time the start of an enrollment is recorded anywhere. **enroll2** reads the newest visible challenged row for the user, checks its row_tick against twenty minutes and its hash_text against the request's browserHash, validates the code against its secret, and writes the enrolled row as today. **recover** reads the same row, gated by its existence, and rebuilds the uri from its secret; **clear** hides it. The challenged row and the enrolled row share a json shape, so validation is a copy today and an edit in place once the table holds current state.

### otp, after

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

The brownie note and letter are gone. task.otps is the same shape as today, built from the challenged rows instead of the notes.

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

Then attachState projects the snapshot from the rows, and for the challenges that still look live it asks the trail which have closed, since a row never changes; the paragraph below has the detail.

**What changed at enter, and what didn't.** The note lookup became a row lookup, one read where the letter arrived free. The trail read grew by one hash and lost nothing. The browser check moved from the door to step two. The replay defense the trail was carrying goes quiet, because there is no letter to replay, and the opened message goes redundant with it. Every outcome name and every remedy stays where it is today: the housemate entering at someone else's challenge hears SignedOut., a code typed at another browser hears Expired., and the three closings close the same way. The trail's accounting job is unchanged; this sprint moves effort out of the brownie, not out of the trail.

**What the snapshot must know about closed challenges.** The brownie removed a note the instant its challenge closed, so the enter box vanished with it. A row does not vanish. A resend supersedes naturally, since credentialOtpGet already keeps only the newest row per address; validation supersedes, since event 4 outranks 3; expiration is row_tick plus twenty minutes, checked at read; removal hides every row. Two closings leave no mark on the row: guesses exhausted, and Held. at enter. The trail knows both, because enter wrote the closed message, so the snapshot asks it — one trailGetAny over the tags of the challenges that look live, made only when any do, which is minutes per month. The evidence row stays untouched, and the trail answers the question it already records.

### wallet, after

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

No trail rows. The envelope is gone; prove1 returns the nonce alone.

**prove1** writes the challenged row with the nonce in json and the browserHash in hash_text. **prove2** parses the nonce out of the signed message and finds the visible challenged row for the user and address that carries it — by the nonce, never by newest, so two tabs proving the same address each find their own challenge, as they do today — then checks the row's row_tick against twenty minutes and its hash_text against the request's browserHash, and verifies the signature around that nonce. The page carries nothing sealed at all: it embeds the nonce in the message it signs, and the server finds the challenge by who, what, and which. A replayed proof after success meets the validated row and the refusal rules, as today.

### The snapshot

It is assembled entirely from the database, which means the server render already has it. `task.otps` derives from the challenged rows' json rather than from notes, and the projection leaves nothing secret in, as attachState leaves the answer out today. The mounted follow-up, brownieHeld, the recovering flag, and the "lands a beat later" comments in OtpEnterList and app.vue all go: the first paint shows the enter boxes and the qr code, because the server could see them.

**The snapshot pays nothing new for the signal.** The brownie gave the page a free signal that a flow was in flight, and the worry is that a database has to be asked. It is already being asked: Get. runs on every page render, on the server, with its eight queries. The otp challenged rows already come back in the Email. and Phone. queries, which read every event and already drive the event the page shows; surfacing a live challenge is projecting the tag out of the newest challenged row's json, and its start from row_tick, when it is under twenty minutes old, inside a collapse that already tracks the newest row per rank. The totp query widens by one filter, from event 4 to every event, with the code deciding enrolled or in flight. The wallet nonce never needs surfacing: a refresh restarts that flow at no cost, and offering to resume it would mean reconciling the challenged address with whatever account the wallet reconnected as, for the sake of one saved click. So the query count on page load stays where it is, the mounted follow-up's second round trip leaves, and the server render paints the in-flight state on first paint.

**The sudo hour**, when it arrives, is a row too — or, once credential_table holds current state, a column on the Browser. row saying until when this browser is elevated, which is what browser_table's abandoned `level` column in data-cleanup.md was reaching for. Either way it is a database fact, readable by any request and any staff tool, not a note only the elevated browser can present.

## Where the trail works today, and where it could work more

Today only otp uses the trail, with the five messages in the examples above: a per-address message the permit step counts against the rate limits and code length, and four per-tag messages that carry the challenge's lifecycle and its wrong guesses. It is read at send and at enter, never on page load, and its json column, documented as recoverable information beside the one-way hash proof, has no production writer. The trail's shape is a yes-or-no proof: did this exact message happen inside this horizon.

**The rule for asking it more: clue, then validate.** Never cold-call the trail with a question like "does this browser have a code out," because that is one query per question for every user, nearly all of whom are mid-nothing — an early otp design that leaned on the trail this way was a pile of such queries, and it was a mess. The clue comes from credential_table, in the queries Get. already makes: a challenged row under twenty minutes old says a flow is in flight. Only when a flow exists and the user acts does one trail query validate, and for otp that query already runs at enter. The cost of a hashed secret is therefore zero extra queries, as long as the hash rides a message the flow is already looking up.

**Why a hash is worth wanting.** The brownie kept secrets out of the database's plain view: scrolling credential_table in the Supabase dashboard, a coworker's phone camera over your shoulder, a screenshot in a support thread. That is not a threat we design around as a priority, and it is not a defense against a reader with the database and time, since a six-digit code behind a hash falls to enumeration. It is a defense against the casual view, and where it costs nothing, it is worth keeping.

**otp: the answer as a hash, decided.** Send writes the answer message beside the three tag messages it already writes. Enter hashes the guess into the same message and adds it to the trailGetAny call it already makes for opened, closed, and guessed-wrong; a row found means the guess is right. The challenged row's json holds provider and tag, and no code ever sits in credential_table. One new trail row per send, no new query at enter, and the answer is exactly as unrecoverable as the trail's other facts.

**wallet: the nonce in json, not the trail.** The nonce is not a secret from anyone: the page embeds it in the message it signs, and it lives in the browser's own memory. A trail row would prove we issued it, but prove2 already proves that by finding the challenged row and comparing the nonce it holds, and a trail message would be a second read where the row is one. Uniformity with otp is the only argument, and it isn't enough.

**totp: the secret in json, because it must be recoverable.** enroll2 validates the first code against the secret, and recover redraws the qr from it; a hash can do neither. And the enrolled row already holds the same secret in plaintext, forever, so the challenged row's twenty minutes add nothing to what the dashboard shows. Sealing the secret at rest, on both rows, would be a hardening of its own and applies to the proven row first.

## What leaves, and what stays

**Leaves.** The brownie section of level2 whole: the essay, brownieRead, brownieHeld, brownieApply, openBrownie, sealBrownie, brownieCheck, and the five-function note vocabulary with its test. The carriage in fetchWorker and the command protocol in the response. The open and seal lines in doorWorker and door.brownie itself. The `'Brownie.'` envelope action. The `letter` parameter on the six level3 functions that take one, and the totp essay above them rewritten around rows. attachState's letter parameter and its projection from notes. The store's mounted function, app.vue's second onMounted and the essay explaining why there are two, the brownie exports in the icarus barrel and the composable, and the grid tests that walk letters through seal and open — rewritten, not deleted, since the flows they prove are unchanged. A brownie left in some browser's localStorage by the old build stays there inert and opaque; fetchWorker stops reading the key, and a transitional removeItem is optional tidiness. And the `'ProveWallet.'` envelope action and the envelope parameter on credentialWalletProve2, with the wallet grid tests rewritten around the row.

**Stays.** sealEnvelope and openEnvelope, which keep the media upload permission and the lambda's hashed result — signed parameters between our own machines rather than provisional state a browser carries. The browserTag cookie and the Browser. row, which are the identity half of the principle above. The trail, doing the work it does today, plus the one message the section above adds.

## What it costs

**A read per step that was free.** The brownie arrived with the request; a row has to be fetched. otp enter gains one database read to find the challenge's row; totp enroll2 gains one beside its existing check, and wallet prove2 one where the envelope open was free. On the order of a hundred milliseconds each, on paths where a human just typed six digits or signed a message. The brownie was built specifically to avoid this — "ephemeral state deserves neither a second database nor Supabase's durability" — and this sprint spends it on purpose, because the database is not a second database, it is the first one.

**Provisional rows accumulate, on purpose.** They already do for otp and wallet: every challenge is an event-3 row today. Totp adds one per enrollment start. These rows stay: they are evidence that the user tried to start something, useful for a later audit, and the abandoned starts we said we wanted to see. row_tick checked at read keeps a stale row from ever acting live, and nothing deletes them.

**Secrets at rest.** An unenrolled totp secret sits in credential_table for its twenty minutes and in history after, since provisional rows stay, beside the enrolled secret that already sits there for good. The otp answer never sits there at all: it rides the trail as a hash. The house position, recorded in smaller-dog.md, is that the database already holds full credentials and is secured accordingly.

**The credential_table pass inherits provisional rows.** data-plan.md asks what replaces mentioned, challenged, and validated once the table holds current state, and offers three candidates: a column on the live row, a transient thing in the brownie, or a fact recorded only in the ledger. This sprint removes the middle candidate and strengthens the case against the third, since a challenge is application state that enter has to read, and ledger_table is written constantly and queried rarely by design. What remains is a row or a column on a row, which is the pass's question to answer and this sprint's job to make easier by having the rows already in place.

## Decisions the sprint must make

**Before or inside the credential_table pass — decided: before, and before the smaller dog too.** Doing this first, on today's table shape, is cheap: otp's challenged row already exists and only grows, totp gains a row it should have had, and the whole brownie apparatus leaves early. The pass then finds provisional rows as a fact rather than a design question. Doing it inside the pass would have avoided touching the same functions twice, but would have tied a small, well-bounded removal to the largest migration on the map.

**The browser binding — decided: kept, carried in hash_text.** The brownie is single-browser by construction: a letter opens empty anywhere but the browser that sealed it. A row is reachable from any browser where the same user is signed in, so the rule becomes a comparison: the challenged row records the browserHash that started the flow, and enter and enroll2 refuse any other. It rides hash_text because that is already where a browser hash lives on a credential row: sign-in writes the Browser. row with the browserHash in hash_text, and credentialBrowserGet reads it back through credential13. Storing the same value somewhere else for a second purpose would be discordant, so the rule is one a reader learns once: on a Browser. row the hash is the browser that is signed in, and on any event-3 row it is the browser that started the flow. credential_table has no browser_hash column — ledger_table and delay_table do — and does not grow one, because under data-plan.md who and where belong to the ledger. The one cost is that every provisional row enters credential13, which is partial on hash_text being non-blank, carrying a value nothing looks up; a b-tree a few thousand entries larger costs storage, not latency. The current-state pass will clear hash_text when a challenged row becomes a proven one in place, a detail for that pass. Relaxing the rule is a feature first-night-accounts.md may want, finishing on a second device, and that document relaxes it deliberately when its threat model is settled.

**The trail — decided: it stays, doing what it does.** Wrong guesses, the horizon, opened and closed: the trail already does that work, and nothing here migrates away from it.

**Where each secret lives — decided.** The otp answer in the trail as a hash, one new message at send and one more hash in the read enter already makes, so no code ever sits in credential_table and no new query runs; the flow already keeps a handful of trail messages for its security and its rate limits, and one more is in character. The totp secret in the challenged row's json under the name the enrolled row already uses, since it must be recoverable. The wallet nonce in the challenged row's json, since it is no secret and a trail row would be a second read. The section on the trail above holds the reasoning for each, and the alternative set aside for otp was the answer in the row's json in plaintext: one place, one shape, and a code visible to anyone scrolling the table.

**Provisional rows — decided: they stay.** A finished, abandoned, or expired challenged row is evidence that the user tried to start something, and a later audit wants it. No cleanup, no scrubbing; row_tick checked at read is what keeps a stale row from acting live.

**The wallet envelope — decided: it joins.** It is provisional state the server authenticates and the page carries, the same thing in kind as a brownie note, and the principle says the database should be the one place; the challenged row it would ride already exists, the nonce is not a secret, and prove2 becomes one row read where the envelope open was free. On the page the nonce and the envelope are local variables inside one function in WalletPanel, never stored, so the change there is that prove1 stops returning an envelope and prove2 stops sending one, and refresh behaves exactly as it does now. The case for keeping it was real and is recorded: the flow works, the envelope is a signed parameter rather than a session — never stored, and gone on refresh because the page holds it in memory, with nothing external orphaned — and sealEnvelope stays in the codebase for the media and lambda customers regardless, so removing this use retires no machinery. The principle won: with the brownie and this envelope both gone, no credential flow keeps provisional state anywhere but the database, which is the right shape for serverless code running in replicated isolates around the world, where no instance can be trusted to remember anything for the next one.

**The two-query snapshot — decided: not this sprint.** attachState's queries could become two, the Browser. row by hash to learn who is here and then every row for that user through credential1, sifted once per type, with the live challenges falling out of the same rows for free. It is the same kind of simplification, and this sprint touches attachState's projection anyway, but it belongs after the credential_table pass: written now, the sift would collapse events per type over ledger-style rows, and the pass would rewrite it over current-state rows where every row for a user is a plain read with no interpretation. credential.md's section on one query with application logic sifting, and the ttd on attachState, hold the idea until then. This sprint changes only what the existing per-type queries project.

## The steps, in order

**The otp move.** credentialOtpSend grows the challenged row's json and writes the answer message to the trail; credentialOtpEnter reads the row instead of the letter and checks the guess in its trail call; attachState projects otps from rows and asks the trail about closings; the grid tests that walk a challenge through the brownie's seal and open walk it through the row instead. The brownie stays in place, unused by otp, so this step ships alone and soaks.

**The totp move.** credentialTotpEnroll1 writes the challenged row; enroll2, recover, and clear read and hide it; the totp essay is rewritten around rows; the grid tests follow. The brownie is now empty of tenants.

**The wallet move.** credentialWalletProve1 puts the nonce on the challenged row's json and the browserHash in its hash_text, and returns the nonce alone; prove2 finds the row by the nonce in the signed message and drops the envelope parameter; the wallet grid tests follow. Independent of the two above, so it can land in either order.

**The removal.** Everything in the leaves list above, in one focused pass, with the door and fetchWorker losing their brownie lines and the page losing its follow-up. The deployed smoke is the flows themselves: start an enrollment, refresh, see the qr code on first paint; send a code, refresh, see the enter box on first paint; prove a wallet end to end; and at a second browser signed in as the same user, see none of it.

**The record.** credential.md's fork section records the fourth step of the trajectory — table, cookie, letter, row — and this document retires, its reasoning folded into the comments above the rows that hold the state.
