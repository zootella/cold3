# hidehow

The battle plan for the hideless sprint. hideless.md is the mission brief: why hiding was a mistake, the rules every table follows after, the shape of credential_table after, and the decisions. This document is the tactics beneath it: the chapters in the order we take them, each one a table, or for credential_table a credential type, with what the code around it does today and what changes. We burn it down as we go. A chapter gains detail as we plan it, and leaves the document when its work lands; when the last one leaves, so does the document.

Three acts, in a fixed order. **The verbs** first: level2 gains the delete and the multi-cell update that the conversions need, and the prose that states the old rule changes, because it stops being true the moment a delete verb exists. **The tables and types** second, one chapter at a time: each converts its code from hiding rows to editing and deleting them, and its hidden rows leave the hosted table along the way. **The column drop** last: once no code and no row uses hide anywhere, one expansion push, one deploy, and one contraction push take the column out of every table and rebuild the indexes without it.

The hide column stays in every table while the tables and types convert, and level2 keeps filtering hide = 0 on every read and filling it on every insert, because the helpers serve every table and the unconverted types still hide. What converts chapter by chapter is the meaning of rows and the code that writes and reads them. credential_table goes type by type rather than as one table because the patterns vary by type: Browser. stacks rows and the newest wins, Name. hides the old row and appends a new one, Email. and Phone. rank the stages and the highest wins. Each type has its own function family, its own grid tests, and its own removal scope.

Every chapter of the tables and types has the same shape. Read the code around the type completely, and write what it does into its section here. Survey its rows in the hosted table, read-only: group by stage, hide, and identity, and list the winner per identity by the rule today's readers apply. Push a data-only migration that deletes the type's hidden rows and its superseded visible rows, the ones that aren't their identity's winner; the survey's counts go in that file's header comment, dated, which is the record of what left. No ledger rows are written for deleted rows, decided September 14, 2026: a row invented from a hidden row would break the ledger's charter several ways, a borrowed tick, no honest build to name, and a snapshot of the table rather than a record of an act, and wrapper_hash already tells a reader which builds wrote no rows. Deploy the type's new code: writers edit and delete, readers look up, grid tests assert exact row counts. Then a second small push: delete again whatever the old code hid or mentioned in the window between the first push and the deploy, and create the type's unique index. The index waits for the deploy because until then the old code hides the previous row before inserting a new one, and a unique index with no hide predicate would refuse that insert. The first push lands before the deploy because the old code ranks, and a rank over one row is that row, while a new reader that has stopped ranking would list a stale Mentioned. row as an address. Smoke the type's panel. Move on.

The groups below are sorted by difficulty, and their order is the working order: the simple types, the involved ones, the hard one, and last the tables where hide was never used, because their whole change is the column drop, which is the last act.

**The verbs.** level2's query family has more than a dozen verbs. Most of them filter hide = 0, the counters count hidden rows too, the adders fill hide with 0 through checkQueryFillRows, queryAddRowIfHashUnique inserts, and none deletes. queryHide is the only mutation of a row's margins, and queryUpdateCells edits one column by one column's match, which is how settingWrite works and nothing else uses. The grid adapter in grid.js already renders a DELETE statement in a branch no helper reaches. This act adds queryDelete(table, cells), filtering through applyQueryCells exactly as queryHide does, json paths included, so a caller that hid by these cells deletes by the same ones. It adds an update that sets several cells by the same filters, since a conversion wants a row's stage and json edited together by user, type, and address. Both get grid tests against example_table beside the ones that hide rows there today. The hide filter and the hide fill stay untouched until the column drop. tables.txt's lines stating that tables are ledgers and a row is hidden instead of deleted change now, and so does any other sentence that says we never remove a row; the sentences that describe hide as a margin wait for the column drop, because they stay true until then.

credentialCloseAccount is a candidate for this act too: it is the one cross-type mutation, hiding every Proven. row of the user in one call and leaving the Challenged. rows standing, and under the rules after the sprint it deletes every credential row of the user. Converting it here, as the first caller of the delete verb, is safe for every type, converted or not, since nothing should remain. Decide when we plan the act.

**credential_table.** How a user can sign in, and whether what they just said is valid to sign them in. Today it is the one table built fully in the ledger style: one row per event in a credential's life, Mentioned., Challenged., or Proven., written by the one writer credentialSet, and read by a family of functions per type that each interpret the rows. The snapshot attachState assembles for the credential panel runs one of those reads per type on every Get. and after every action. The columns: the three margins, user_tag, type_text, event_text, the f triad, hash_text, and json. Every index on it leads with hide. Every queryHide site in the code is on this table. Beside the per-type functions stand credentialCloseAccount, above, and credentialGet, an exported stub with no body. credentialEventRanks ranks the stages for the otp reader, and hasEvent and checkEvent guard the stage words at the writer. The hosted survey of September 7, 2026 found about three hundred rows, three quarters of them hidden, and a few dozen expected after the conversion: one per session, name, password, totp enrollment, wallet, oauth link, and proven address, plus whatever is in flight. Its types are the chapters of the next three groups.

# Simple

One Proven. row per user, and no flow in flight. Today a set hides the old row and inserts the new one, a remove hides, and at most one row is ever visible. After, a set edits the row in place or inserts when there is none, a remove deletes, and a unique index makes the one-per-user rule the database's own. These chapters teach the edit-or-insert and delete pattern, the unique index dividend, and the hottest read in the application, in that order.

## Password.

One Proven. row per user: hash_text holds the hash the page computed, and json holds the cycles it used. Read by userTag for the snapshot, for the cycles a sign-in page fetches first, for the current-password check before a change, and by credentialPasswordVerify at sign-in, which writes a Refused. ledger row on a miss and touches no table. Set hides the user's Proven. row and inserts the new one, so at most one is ever visible. Remove hides it. Grid tests cover set, change, verify, and remove, sign-in misses, and the sign-up and close account flows.

**Hidden today:** yes, by Set and Remove, both filtering the user, Password., and Proven., plus close account. After: Set edits the hash and cycles in place or inserts when the user has none, Remove deletes, and a unique index holds one Password. row per user.

## Name.

One Proven. row per user holding the three forms: f0 normalized for the route and for matching, f1 the route's face, f2 the display name. Read by userTag for the snapshot and the totp app label, by f0 and f2 in credentialNameCheck to see whether a name is taken, by f0 at sign-in, and by part1 in the render endpoint, the public lookup that turns a profile route into a user. Set checks availability, hides the user's old row, and inserts, both patterns at once. Remove hides. Uniqueness of f0 and f2 across every user is read-then-check only, and nothing in the database enforces it. Grid tests cover get and collisions, remove, the change that frees the old name, and sign-up.

**Hidden today:** yes, by Set and Remove, plus close account. After: Set edits the three forms in place or inserts, Remove deletes, and unique indexes on f0 and f2 among Name. rows close the race the check leaves open.

## Browser.

One Proven. row per signed-in session: hash_text is the browser hash and user_tag the user. credentialBrowserGet by hash on credential13 is the hottest read in the application: every credential action, the report endpoint, and both paths of the oauth handler start with it. Set inserts on sign-up and sign-in without touching the browser's existing row, so a second sign-in at a browser stacks a row on the first and the newest visible one wins. Remove, which is sign out, hides every Browser. row of the user, so a browser where two users signed in returns to the earlier one. Grid tests cover sign-out and the multi-user flow, and sign-up and close account touch it.

**Hidden today:** yes, by Remove, plus close account. Superseded by appending: yes, every sign-in. After: one row per browser hash, whoever's it is; sign-in deletes the browser's row and inserts the new one, sign-out deletes every row of the user's, and a unique index on hash_text among Browser. rows makes one session per browser a fact the database holds.

# Involved

A flow in flight rides a Challenged. row beside the Proven. row a finished one leaves. Today the flow's last step inserts the proof and hides the challenge, or hides nothing at all, and abandoned starts stand until something hides them by accident. After, the challenge row is edited to Proven. in place when the flow finishes, deleted the moment the flow knows it is over, and left to the sweep only when nobody came back. These chapters teach the edit of a stage in place, the delete at every exit of a flow, and, for oauth, a challenge written and closed from a file outside level3.

## Totp.

At most one Proven. row, with the shared secret in json, and one start, a Challenged. row with the secret it is enrolling and row_tick as its twenty-minute clock. _totpRead reads every visible Totp. row of the user in one query and is the one place a start is read, so the clock holds everywhere. Enroll1 hides earlier starts and inserts a new one. Enroll2 checks the first code, calls Set, which hides any Proven. row and inserts, then hides the start. Clear hides the start. Remove hides the Proven. row. Verify reads only, guarded by trail counts. Grid tests cover set and re-enroll, verify and the guard, and the enrollment flow through cancel, housemate, and the stale start.

**Hidden today:** yes: starts through _totpHideStarts from Enroll1, Enroll2, and Clear, and the proof by Set and Remove, plus close account. A start past twenty minutes is ignored at read and never hidden. After: one Totp. row per user, the start edited to Proven. in place when the code checks out, deleted by Clear and Remove, the abandoned start left to the sweep, and a unique index on user_tag among Totp. rows.

## Oauth.

Two kinds of row, written from two files. The oauth handler under the lite door writes a Challenged. row with the provider in json when a signed-in user starts a flow at the signin path, before @auth/core runs. Its signIn callback, once the provider answers, calls credentialOauthSet, which runs two read checks, this user has no account with this provider yet and no other user holds this identifier through credential15, and inserts the Proven. row: provider, identifier, handle, name, and the whole proof in json, and the provider's email in the f triad when it gave one. A cancel or an error at the provider writes a Cancelled. ledger row and nothing here. Get lists the user's Proven. rows filtered to the configured providers. Remove hides the Proven. row by user and provider. Grid tests cover linking and re-linking, the cross-user identifier claim, the shape of the note, and the planner choosing credential15, whose EXPLAIN spells hide = 0 in its text.

**Hidden today:** yes, by Remove, plus close account. Never hidden: every Challenged. row, since no path closes one when its flow finishes, a couple dozen of them visible on September 7; and one hidden row typed Discord. from before the oauth types unified. After: the callback edits the challenge to Proven. or deletes it on a refusal, the cancel path deletes it through a level3 call, only a flow nobody returns from waits for the sweep, Remove deletes, and credential15 becomes unique among Proven. rows.

## Ethereum.

The flow writes every stage. Prove1 always writes a Mentioned. row, runs the refusal check, held by another user, already mine, or the slots full, and writes a Challenged. row with the nonce and connector in json and row_tick as its clock. Prove2 finds this user's challenge for this address by the nonce parsed from the signed message, checks the signature offline or on chain for a contract wallet, hides that challenge, then calls credentialWalletSet, which runs the rules again and inserts the Proven. row with the nonce in json. Get lists the user's Proven. rows; Holder finds the Proven. row for an address on credential2. Remove hides the user's proof of one address. Grid tests cover the limit, the shared wallet, remove scope, retired proofs, the whole flow with a real signature, the challenge's ownership and clock, wrong signers and unissued nonces, two tabs, the refused start, and the triad.

**Hidden today:** yes, the spent challenge at Prove2 and the proof at Remove, plus close account. Never hidden: every Mentioned. row, and every challenge whose nonce was never spent, a handful of each visible on September 7. After: the mention is a ledger row only, Prove1 deletes this user's earlier challenge to the same address before inserting the new one, Prove2 edits the challenge to Proven. in place so the connector and the nonce both stay on the row, Remove deletes, and a unique index on f0 among Proven. rows holds one holder per address.

# Hard

One family serving both address types, with the most reading logic in the table and the largest test surface. An address has stages and a read ranks them, a proof and a live challenge for the same address may both stand, a resend replaces a challenge, and the trail beside the table carries the answer and the counts. This is the chapter where the rank map, the grouping, and the mentions all leave, and where the snapshot's projection of live challenges rides.

## Email. and Phone.

One family with a type parameter. Send checks the holder, counts the trail for the permit, writes a Mentioned. row with the outcome when it refuses and without one when a code goes out, composes the code, sends it through the lambda inside a ledger pair, hides the user's earlier challenges to the same address so a resend shows one enter box, writes trail rows for the opened challenge and for the answer as a hash, and writes the Challenged. row with the provider and the challenge tag in json. Enter finds the challenge by user and json tag, counts wrong guesses in the trail, rechecks the holder, and on a correct guess inserts the Proven. row then hides the challenge, on a held address hides it, and on the last wrong guess allowed hides it. Get reads every visible row of the type for the user, groups by f0, lets the highest stage win through credentialEventRanks with the newest face, and projects the live challenges for the enter boxes. Holder finds the Proven. row by type and f0. Remove hides every row about the address, whatever its stage. Grid tests cover the otp rules, the lifecycle sift, peers, claims, ownership, the race, and remove mid-challenge.

**Hidden today:** yes: the resend at Send, the closes at Enter through _otpHideChallenge, and Remove, plus close account, which hides Proven. only and leaves this type's mentions and challenges standing. Never hidden: every Mentioned. row, and a challenge abandoned past its twenty minutes. After: the mention is a ledger row only, Send deletes the earlier live challenge and inserts the new one so row_tick stays the challenge's clock, a correct guess deletes the challenge and inserts the proof, or edits the proof's json when the user re-proves an address she holds, a proof and a challenge for one address may stand at once, Remove deletes both, Get loses its rank map and grouping since the rows are the addresses, and a unique index on type and f0 among Proven. rows holds one holder per address.

# Trivial

Every table here carries the hide column and no code ever sets it: the read helpers filter it and the adders fill it, and that is all. Their whole change is the column drop, the last act, which runs once for every table on migration.md's playbook after the last chapter above lands and no row anywhere is hidden. One expansion push sets a scaffolding DEFAULT 0 on hide in the cloud tables, so an insert stays whole the moment deployed code stops sending the column, and adds the rebuilt general indexes, the same columns and purposes without hide, each under the next number its table has never used. One deploy has level2 stop filtering and filling hide, drops queryHide, and turns the counting helpers' "including hidden" into nothing, since there is no longer another kind. One contraction push drops the column from every cloud table, which takes the old indexes with it, and drops the scaffolding defaults; the registry shows the final shape in the same commit, the registry-only tables lose the column there too, and a drift check closes it, columns matched by name and exact inside indexes. Then the document sweep: database-stack.md's shape section describes two margins and a row that leaves by deletion, tables.txt's definition of hide goes, data-cleanup.md's three-patterns section leaves with the question it sized, credential.md's hide-does-the-work section describes what runs, testing.md notes the adapter's delete branch is reached, and migration.md gains the paragraph on a change of row meaning.

## trail_table

Hashes of messages about things that happened, so a limit or a guard can count them inside a horizon: how many codes an address has had lately, how many wrong guesses a challenge has taken, how many wrong totp codes a secret has seen. Written by trailAdd and trailAddMany from the otp send and enter, the totp check, and the trail demo endpoint; read by trailGet, trailGetAny, trailCount, and trailRecent, every count and get bounded by a since tick. The expiration column means the tick at which a row could be removed, and every production writer leaves it at zero, keep forever; only a grid test passes a value. Never mutated.

**Hidden today:** no. Nothing hides a trail row, hundreds of rows and none hidden on September 7, and hide is only filtered by the read helpers and named by trail1 and trail2. One decision sits beside the column: whether expiration becomes real. hideless.md has the writers set it per message and a housekeeping sweep delete rows past it, one job with several tenants alongside the stale challenges of every type and later the quiet anonymous identities, while tables.txt's own note argues the btree ending in row_tick makes old rows cheap to ignore and deletion unnecessary. That is its own small decision, separate from the column.

## ledger_table

The durable record: written constantly by ledgerAdd from every mutating function and by recordHit, and read by nothing in production, only by grid tests. Every index but ledger7 carries a hide predicate, and ledger7 stays.

**Hidden today:** no, thousands of rows and none hidden on September 7. Nothing changes here but the column and the index rebuilds. The planner grid tests spell hide = 0 in their EXPLAIN text and change with the indexes. hideless.md's count of the ledger's indexes predates ledger8 and ledger9, which the ledgerathon added, so its counts of those indexes and of the cloud indexes naming hide are both low.

## delay_table

Task durations for the user, one row per Hello. from the report endpoint, with the page and server times in d1 and d2 and the other slots at -1. Nothing reads it, and no grid test names it. Never mutated.

**Hidden today:** no, thousands of rows and none hidden on September 7. The column and delay1 and delay2 leave, and nothing else changes.

## settings_table

Settings for the application as a whole, today the demo hit counter behind the hit endpoint. settingRead inserts the default row when the name is missing, and settingWrite edits the value cell in place through queryUpdateCells, which makes this the one table that never adopted the ledger style. settings1 keeps names unique among visible rows. No grid test names it.

**Hidden today:** no. The column leaves, settings1 is rebuilt as a plain unique index under the next number, and queryUpdateCells loses its hide filter with the rest of level2.

## example_table

The registry-only sandbox the grid tests write in, one column of each kind. No production code touches it, but the grid tests that hide rows do it here, and the verbs act's tests join them; the column drop turns them into delete tests. example1 names hide. The column leaves with the registry edit in the column drop's commit, with no migration, which is what registry-only means.

## profile_table

A registry-only sketch with no code, holding a user's profile text. The column leaves with the registry edit.

## user_table

A registry-only sketch with no code, holding a stage per user and a comment that sketches hidden and closed as states a staff member could set. Those become a column or a row when something needs them, never a hide. The column leaves with the registry edit.
