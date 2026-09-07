# ledgerathon

The plan for the sprint that has every mutation of a live table write a ledger row beside it, from the same function that mutates, so nothing that happens here goes unrecorded: every credential flow, sign-up and close account, settings, and beyond our own tables the dealings with third parties no record covers. It is the first of three sprints in a fixed order, planned in data.md: the ledgerathon, then hideless, which retires the hide column and converts every table to editing cells and deleting rows, then the smaller dog, which removes the Datadog apparatus. The order runs backward from the reason. Datadog can only leave once every change in the system has its record in ledger_table, and those records are only proven complete once the tables have stopped keeping history of their own, because a fact a mutating table loses is lost only to that table and never to the ledger. So this sprint runs first and soaks, for at least a week of real use, before hideless deletes anything.

The rule it installs is permanent. From the ledgerathon on, a new mutation arrives with its ledger row, in the same turn that writes it, and a review that finds a mutation without one has found a bug. It is a sprint of many sessions, and a new session takes it, reading this document to start. Nothing in it is built.

## What the ledger holds today

Verified against the hosted database and the code on September 7, 2026. ledger_table holds 2,910 rows, and 2,901 of them are hits, one per browser per hour. The rest are the three production call sites: the otp send in level3, whose row carries the whole task the lambda returned, and the two sites in the oauth handler, the proof or refusal at the callback and the cancel. Two rows still carry MessageSent., the action the send wrote before the vocabulary settled, and a data-only migration can fold them into the type's Challenged. or leave them as they are. Nothing in production reads the table.

The shape is general on purpose, and this sprint asks nothing new of it. The margins, then wrapper_hash for the build that wrote the row; ip_text, origin_text, and client_json's geography and browser, filled from the door on every row; browser_hash and user_tag_text for who was here; action_text, event_text, and provider_text for what happened, in tags rather than codes; hash_text for the one thing the row is about, so every record about an address is one indexed lookup; and json for everything else. Six indexes, by browser, user, action, hash, event, and provider, newest first. _ledgerRow in level3 is the one place a row is assembled, and it reads the door through getDoor, which tosses when there is none, because a ledger row with no request behind it is a bug in the caller.

## The rules

- **Every mutation of a live table writes its ledger row, and the function that mutates is the function that records.** Not the endpoint above it, so a new caller cannot forget, and a grid test that walks the function proves the row.
- **A ledger row says who acted, on what, from where, and when.** user_tag_text is the user who was authenticated to make the request. browser_hash, ip_text, origin_text, and client_json come from the door. row_tick is the moment. wrapper_hash is the build. hash_text names the thing acted on when there is one, and json holds the rest.
- **A record table is never mutated, and a record gets no ledger row.** ledger_table, delay_table, and trail_table are appended to, and a wrong record is corrected by a later record.
- **The ledger is the history.** A live table's own history, the hidden rows credential_table keeps today, is a duplicate with less in it, and hideless removes it once this sprint has made the ledger complete.

## The convention

The level3 function that writes a credential_table row, or edits one, or deletes one, writes the ledger row in the same function, immediately after the mutation succeeds. The endpoint passes nothing new, once the door carries the browser hash the way it carries the ip, origin, geography, and agent that _ledgerRow reads today. doorWorker and doorWorkerLite compute the hash from the cookie and hand it down as a parameter, and nothing pins it on the door, so a mutation deep in level3, credentialNameSet with its one userTag parameter, has no browser hash in hand. The sprint pins it as door.browserHash at the two doors that have one, _ledgerRow reads it from there by default, and the grid door gains one for the tests. The alternative, threading a browserHash parameter through every mutating signature, is a decision below. The two oauth sites that write ledger rows from site code today move down: the proof row into credentialOauthSet, which already receives the provider's proof, and the refusal row beside it. The Cancelled. row stays in the handler, because a cancel at the provider mutates nothing and no level3 function runs.

ledgerAdd tosses without a door. Every mutation in production runs below one of the three doors, and every grid test runs below the grid door, so this costs nothing new. A one-off script that mutates rows would run its work inside doorAsyncLocalStorageRun with a small script door, which is a new and tiny thing to write the first time a script needs it.

## The vocabulary

action_text is the subject, which for credential_table is the credential type, Browser., Name., Password., Totp., Ethereum., Oauth., Email., or Phone., the same word the credential row carries in type_text, so a ledger query by action and a credential query by type speak the same names. event_text is the verb. Four are in use or written today: Challenged., Proven., Refused., and Cancelled. The sprint adds the rest of a small set, Mentioned., Removed., Replaced., Expired., and Closed., and keeps the credential lifecycle's words where they fit: a sign-in is Browser. Proven., because the user proved control of the browser, and a sign-out is Browser. Removed. The vocabulary stays open by design, since checkActionOrBlank checks the shape of a tag and not a list, and two things keep it honest: a comment beside ledgerAdd listing the words in use, and the grid tests, which pin the exact word each flow writes.

## Actor and subject

user_tag_text is the user who was authenticated to make the request, which is the one identity the endpoint resolves from the Browser. row. Today the actor is always the subject, since every credential action is self-service. When a staff action arrives, the acting user goes in user_tag_text and the user acted upon rides json as subject, so a query by user_tag_text answers what a person did and a query on the subject path answers what was done to them. That is a decision to record now so the first staff tool does not invent its own.

## What json carries, and never carries

The facts that make the row useful later and that no column holds: the tag of a challenge, the address forms, the connector a wallet came in over, the previous name beside the new one, the cycles of a password, the identifier and handle of an oauth link, the outcome of a refusal. Never a secret: no password hash, no totp secret, no wallet nonce still live. The one exception already decided stays decided, the otp send row holds the lambda's whole task with the message text, per data-cleanup.md's closed item, because the row is the complete record of what we did with the provider.

## The inventory

Every function that mutates, and the row it writes. The credential rows a flow writes today are unchanged by this sprint, and hideless.md describes what they become; this list is only what the ledger gains.

**Browser.** credentialBrowserSet writes Browser. Proven. with hash_text the browser's hash, so the session is findable by browser as well as by user. credentialBrowserRemove writes one Browser. Removed. per session it ends, each with that session's browser hash, so an investigation following one browser sees its sign-outs beside its sign-ins.

**Name.** credentialNameSet writes Name. Proven. with the three forms and, when a name is being replaced, the previous three under previous. credentialNameRemove writes Name. Removed. with the forms that left. A refused set, name taken or invalid, writes Name. Refused. with the outcome, because a run of refusals is worth seeing.

**Password.** credentialPasswordSet writes Password. Proven. with the cycles and whether it replaced an earlier password. credentialPasswordRemove writes Password. Removed. No hash rides the ledger.

**Totp.** credentialTotpEnroll1 writes Totp. Challenged., noting whether it replaced a start in flight. credentialTotpEnroll2 writes Totp. Proven. on success and Totp. Refused. with BadCode. on a wrong code, since enrollment has no trail counting guesses. credentialTotpClear writes Totp. Cancelled. credentialTotpRemove writes Totp. Removed.

**Ethereum.** credentialWalletProve1 writes Ethereum. Mentioned. with hash_text the hash of the address, the mention's home, and its only one once hideless removes the credential row, then Ethereum. Challenged. with the nonce and connector, or Ethereum. Refused. with the outcome when the refusal check declines. credentialWalletProve2 writes Ethereum. Proven. with the nonce that proved it, or Refused. for a bad signature, an expired nonce, or a slot that filled while the user was signing. credentialWalletRemove writes Ethereum. Removed.

**Oauth.** credentialOauthChallenge writes Oauth. Challenged. with the provider. credentialOauthSet writes Oauth. Proven. with the provider, identifier, handle, name, and the proof, the row the handler writes today, or Oauth. Refused. for already-linked and claimed-elsewhere. credentialOauthRemove writes Oauth. Removed. The handler keeps Oauth. Cancelled.

**Email. and Phone.** credentialOtpSend writes the type's Mentioned. row on every send, the Held. refusal riding its json as the outcome, so the evidence that a confused user keeps typing an address that isn't theirs stands in the ledger, beside the credential row until hideless removes it. The Challenged. row it writes today stays as it is, the lambda's task in json, gaining replaced when the send retires an earlier live challenge. credentialOtpEnter writes the type's Proven. with the tag that proved it, or Expired. when the fourth wrong guess closes the challenge. Wrong guesses stay in the trail, where the count lives. credentialOtpRemove writes Removed. per row it deletes.

**Close account.** credentialCloseAccount writes one Removed. per credential row it deletes, each with closing in its json, and one Account. Closed. row at the end, so the closure is one query away and the detail is beside it.

**Sign-up.** The endpoint mints a userTag and calls three set functions, which write their three rows. Whether the minting itself deserves an Account. Created. row, and where it would be written given that the endpoint and not a helper mints the tag, is a decision below.

**settings_table.** settingWrite writes Setting. Changed. with the name, the previous value, and the new one. settingRead's insert of a default is a write too, rare, and gets Setting. Created.

**Beyond our own tables.** The ledger's second purpose is dealings with third parties, and data-cleanup.md lists three that no record covers: the turnstile failure, the upload lambda's storage call, and the chain provider call in wallet prove step 2. The last two get their rows here, from the worker side where a door stands beneath them. Turnstile is a special case and gets no ledger row. A failed bot check is not a change to our data; it is what logAudit was for, a record of our experience with a third-party service, so that trouble at four in the morning can be worked out later. Its check also tosses inside level2 before any endpoint runs, and level2 cannot import ledgerAdd from level3, a seam not worth dictating the layering of the application. The smaller dog picks its channel: console.error to the Cloudflare dashboard, or the one async dog that survives, to Datadog. The lambda's own audit of the message task is not converted, since the worker already writes that row, and it leaves with the smaller dog.

**Records.** recordHit, recordDelay, and the trail writers write records, not mutations, and get no ledger row.

## The two writes

PostgREST has no transactions, so a mutation and its ledger row are two round trips, and the direction owes an answer for what happens when the second fails. The order is mutate first and record second: the alternative, recording first, leaves a row claiming something happened when the mutation then fails, and a false record is worse for an audit than a missing one. A failed record then tosses, so the request fails loudly at the top gate, the console.error lands in the provider dashboard, and the gap announces itself rather than hiding. The standing assumption in tables.txt, that neighboring database calls in one worker are not interleaved by anyone else, is what makes the pair workable, and two consecutive calls to the same service from the same isolate fail together far more often than they fail apart. If the gap ever bites in practice, the escape hatch is a Postgres function called through supabase.rpc, which runs inside one transaction and is the one path in the stack that could make the pair atomic. Not now, and recorded here so the day it is needed nobody rediscovers it.

## The cost

An awaited ledger write is on the order of a hundred milliseconds on every path that mutates. Sign-in is the hottest of them and gains one write. Accept it plainly: the paths are rare and human-paced, a person just typed a code or signed a message, and the alternative, a fire-and-forget successor to keepPromise, is exactly the parking lot the smaller dog is removing. A flow that writes several rows at once, close account and sign-up, sends its ledger rows through ledgerAddMany in one call.

## Testing

Every grid test that walks a flow asserts the ledger rows beside the credential rows: how many, which action and event, which hash, and the facts in json. That needs a reader, and there is none: nothing in production reads ledger_table today. The sprint adds a small ledgerGet family, rows by user, by hash, by action, newest first, the reads the six indexes already anticipate, for tests first and staff pages and robin after. A rule a test proves in isolation is worth little, so the assertions ride the flow tests, not a separate suite.

## Decisions the sprint must make

Each with a recommendation, none taken.

- **Actor and subject on a ledger row.** user_tag_text is the acting user; the subject rides json when they differ. Recommended as written above.
- **Where a mutation gets its browser hash.** Pinned on the door as door.browserHash by the two doors that compute one, and read by _ledgerRow by default, so no level3 signature changes. Recommended over threading it through every mutating function, which is the shape smaller-dog.md sketches for turnstile alone.
- **The order of the two writes and the failure.** Mutate first, record second, a failed record tosses to the top gate. Recommended above, with the rpc escape hatch recorded.
- **The verb list.** Mentioned., Challenged., Proven., Refused., Cancelled., Removed., Replaced., Expired., Closed., open by design and pinned by tests. Recommended.
- **Whether refusals get rows.** Yes where the flow already returns an outcome worth counting and nothing else records it: oauth, wallet, totp enrollment, name. No for otp wrong guesses, which the trail counts.
- **Whether sign-up writes an Account. Created. row, and where.** Recommended yes, from a small helper the endpoint calls beside the three set calls, so the one place a userTag is minted leaves a record, and so anonymous-users.md's early identity record has the row to grow from.

## What this document leaves alone

hideless, which converts the tables and is where the credential rows this sprint writes beside become one row per credential; nothing about how credential_table hides and ranks changes here. Turnstile's channel, which the smaller dog picks. The smaller dog's removal pass, which takes logAudit, the lambda's own audit of the message task, and the parking lot once this sprint and hideless have landed. Robin, which reads what this sprint writes and is planned wherever robin is planned.
