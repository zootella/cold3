# hideless

The plan for the sprint that retires the hide column and the ledger style of table that grew around it, table by table: a row gets edited when its data changes and deleted when its absence is the truth, and a read becomes a lookup. It finishes what data-plan.md set as the direction: ledger_table carries the history, and every other table goes back to being an ordinary database table. It is the second of three sprints in a fixed order, planned in data.md. The ledgerathon runs before it, planned in ledgerathon.md, and has every mutation of a live table write a ledger row beside it, so that by the time this sprint deletes a row the ledger already describes it better than the row did. This sprint is that one's proof: once a table deletes what it no longer holds, a mutation that left no ledger row is a loss that shows, where a hidden row would have covered for it. The smaller dog runs after it, the removal of the Datadog apparatus, which can only go once every change has its record in the ledger and the ledger has been proven complete.

The sprint is large. It touches every table we have, the query helpers in level2 that every table rides, most of level3, and the doctrine written into database-stack.md and tables.txt. What it buys is a data layer that reads like every database since the nineties, which is the shape that is easiest for a person or a model to hold whole, easiest to test to the last row, and easiest to be certain is secure. It is a sprint of many sessions, and a new session takes it, reading this document to start. Nothing in it is built.

## Why hiding was a mistake

The ledger style was a real design, made on purpose. Tables were to be append-only histories, a nonzero hide marking a row retired, and the present state derived from the rows on every read. ledger.md holds the case for and against in full, and data-plan.md records the decision to leave it. This document does not repeat that argument. What it adds is what the style has cost on the one table that adopted it fully, and why the cost is no longer buying anything.

**Every read interprets.** credential_table cannot answer a simple question. credentialOtpGet fetches every visible row of one type for a user and walks them, grouping by address and ranking each row's stage through credentialEventRanks, so that the highest stage wins and the newest row of that stage supplies the face. That walk runs on every snapshot, and attachState runs eight queries to assemble one. The interpretation is not hard to write, but it never gets cheaper, it has to be right in every place it appears, and it sits under the hottest reads in the application.

**Hiding records nothing about the hiding.** A hidden row keeps row_tick, the moment it was made. The moment it was hidden is nowhere. Who asked, whether the user herself or someday a staff member, is nowhere. The browser and the address they asked from are nowhere. The design kept the row as evidence and threw away the half of the story an investigation actually needs.

**Invisible rows are still rows.** Every reader filters them, every index leads with hide or carries a WHERE hide = 0 predicate, tests have to reason about rows they cannot see, and a reader has to remember which function hides what: otp remove hides every row about the address, wallet remove hides only the proof, close account hides proofs and leaves challenges standing, and nothing hides an oauth challenge at all. None of that is written as a rule a stranger could predict.

**The evidence it kept is the wrong evidence.** Once a ledger row records that a credential was removed, with who and where and when and which build wrote it, the hidden credential row is a duplicate with less in it. And once every mutation writes that ledger row, hiding has no job left.

jsonb is what made this visible. The json cell type let a row hold whatever shape a moment had, which is what let ledger_table be one general table rather than a purpose-built audit twin per table, which is what lets audits leave Datadog in the smaller-dog sprint, which is what lets robin read our own database to notice, overnight and without staff, that codes sent through one provider are taking twice as long to come back since two in the morning on a Tuesday. With facts like that written where they can be queried, the hide column is answering a question nobody asks anymore.

## Where the tables stand today

Verified against the hosted database and the code on September 7, 2026.

**credential_table holds 292 rows, 71 visible and 221 hidden.** Three quarters of the table is rows that nothing reads except the two counting helpers. The hidden rows are the churn of development: 40 hidden Ethereum. proofs against 1 visible, 36 hidden Totp. proofs against 4, 19 hidden Oauth. proofs against 1. The visible rows are not all current state either. 22 visible Oauth. Challenged. rows stand because nothing hides an oauth challenge when its flow finishes, and Ethereum. carries 8 visible mentions and 4 visible challenges, abandoned starts that stay visible because prove step 2 hides only the challenge whose nonce it spends. Those rows are not an argument that nothing should be retired; they are the ledger style failing at its own job, and under the rules below each would leave the table the moment its flow ended. One hidden row carries the type Discord., from before the oauth types unified under Oauth. After the collapse below, the table holds about three dozen rows: one per session, name, password, totp enrollment, wallet, oauth link, and proven address, plus whatever is in flight.

**Every other table has hide at zero on every row.** trail_table holds 750 rows, ledger_table 2,910, delay_table 6,947, settings_table 1, and not one is hidden. hide is a column in five cloud tables and a mechanism in one.

**In the code,** level3 calls queryHide at fifteen sites, every one on credential_table. level2 has thirteen query verbs: eight filter hide = 0, two count including hidden rows, the two adders fill hide with 0 through checkQueryFillRows, queryAddRowIfHashUnique inserts, and none deletes. The grid adapter in grid.js already renders a DELETE statement, in a branch no helper reaches. Seventeen cloud indexes name hide, either leading with it, credential1 through 4, credential13, credential15, trail1, and trail2, or in a predicate, delay1 and 2, ledger1 through 6, and settings1. The role the worker connects as already holds DELETE on every table, so no grant changes.

**In the notes,** tables.txt states the old rule outright at lines 19 and 20, tables are ledgers and a row is hidden instead of deleted, and defines hide at line 220. database-stack.md's shape section names hide as the third of three margin columns every table starts with. Both are corrected when the table sprint lands, tables.txt in place because it only shrinks.

## The rules after the sprints

Stated once, and every section below follows them.

- **A live table is the shortest possible statement of the system as it exists right now.** Outside ledger_table, a table holds the present truth and nothing else, and no history at all, because history is what ledger_table is for. When data changes, the row is edited. When a row's absence is the correct picture, the row is deleted, at the moment the code knows it, not later by a sweep. A read filters by identity, gets the row, and uses it. Tidiness is a duty once the ledger's records are complete: a finished oauth challenge, an abandoned wallet start, a session signed out, each leaves its table the moment the flow knows it is over.
- **Every mutation of a live table writes its ledger row, and the function that mutates is the function that records.** Not the endpoint above it, so a new caller cannot forget, and a grid test that walks the function proves the row. This is standing policy from the ledgerathon on: a new mutation arrives with its ledger row, in the same turn that writes it.
- **A ledger row says who acted, on what, from where, and when.** user_tag_text is the user who was authenticated to make the request. browser_hash, ip_text, origin_text, and client_json come from the door. row_tick is the moment. wrapper_hash is the build. hash_text names the thing acted on when there is one, so every record about an address gathers under one lookup, and json holds the rest.
- **A record table is never mutated.** ledger_table, delay_table, and trail_table are appended to, and a wrong record is corrected by a later record, never by editing one. The one deletion they see is housekeeping: a trail row past its expiration goes.
- **A challenge is present truth, not history.** A flow in flight is a row with a stage, edited to Proven. when the flow finishes, and deleted the moment the flow knows it is over: cancelled, refused, replaced, or answered wrong for the last time. The sweep is only for the start nobody came back to. The ledger row written at each of those moments is the history.
- **A mention is history, not state.** That a user typed an address is a fact worth keeping, and it is a ledger row. It is not a credential and it stops being a credential_table row.
- **Nothing reads history from a live table.** A staff page or a robin query that wants the story reads the ledger.
- **No row is ever hidden.** The column leaves every table, and the word leaves the vocabulary.

## credential_table becomes an ordinary table

### The shape after, type by type

The table keeps its columns. What changes is what a row means: one row per credential the user holds or is in the middle of proving, edited and deleted rather than superseded and hidden. event_text stays, narrowed to two words, Challenged. for a flow in flight and Proven. for a credential held, and it is a state column rather than a lifecycle vocabulary. Mentioned. leaves the table.

**Browser.** One row per signed-in browser, keyed by hash_text, one session per browser. Sign-in deletes any session row this browser already has, whoever's it was, then inserts the new one. Sign-out everywhere deletes every session row of the user's. Today's code inserts on sign-in without retiring the browser's existing row, and credentialBrowserGet returns the newest visible row for the hash, so a second user signing in over a first user's session stacks a row on top of hers, and his signing out returns the browser to her. One row per browser ends that.

**Name.** One row per user. Set edits the three forms in place, or inserts when the user has none. Remove deletes it.

**Password.** One row per user. Set edits hash_text and the cycles in place, or inserts. Remove deletes.

**Totp.** At most one row per user: Challenged. with the secret in json while enrolling, then the same row edited to Proven. when the first code checks out. Enroll step 1 deletes a start in flight before inserting a new one. Clear deletes the start. Remove deletes the enrollment. A start past twenty minutes is ignored at read exactly as today and deleted by the sweep.

**Ethereum.** Up to two Proven. rows per user, distinct by f0, and one Challenged. row per address in flight with the nonce and connector in json. Prove step 1 deletes this user's earlier challenge to the same address, if any, and inserts the new one. Step 2 edits the challenge to Proven. in place, so the connector and the nonce that proved it both stay on the row, as they do today across two rows. A refused step 1 writes only its ledger rows.

**Oauth.** One Proven. row per user per provider, and one Challenged. row per provider while the flow runs. The callback edits the challenge to Proven. with the identifier, handle, name, and proof, or deletes it when the proof is refused; a cancel at the provider, where the handler knows the provider and the browser, deletes it through a level3 call; only a flow nobody returns from waits for the sweep. Remove deletes.

**Email. and Phone.** One Proven. row per user per address, and one Challenged. row per address in flight with the provider and tag in json. Send deletes an earlier live challenge to the same address and inserts the new one, so row_tick stays the challenge's clock. Enter with the right code deletes the challenge and inserts the proof, or, when the user is re-proving an address she already holds, edits the proof's json with the tag that proved it again. The fourth wrong guess deletes the challenge. Remove deletes every row about the address. A proof and a challenge for the same address may stand at once, the one case of two rows per identity, because a proof held and a proof in flight are two different facts about the present.

### The uniqueness dividend

Once each identity is one row, the rules the code enforces by reading first become constraints the database enforces itself, as partial unique indexes by type: one session per browser hash, one name per user with f0 and f2 unique across all Name. rows, one password and one totp per user, one holder per proven wallet address, one account per oauth identity, which turns credential15 unique among Proven. rows, and one holder per proven email or phone. The read-then-check code stays, because it produces the graceful outcome, Held. or WalletClaimedElsewhere. or OauthAlreadyLinked., and the index closes the race the check cannot: two users proving the same address in the same second today both succeed if both pass the enter-time recheck. Under the index the second insert raises 23505, which is the quiet answer queryAddRowIfHashUnique already knows how to take, and the flow turns it into the same graceful outcome.

### The reads after

credentialOtpGet loses its rank map and its grouping: the rows are the addresses. credentialEventRanks, hasEvent, and checkEvent narrow to two words or leave. credentialBrowserGet is one row by hash. credentialTotpGet's read of everything totp knows about a user is one row. And the two-query snapshot that brownieless.md deferred, the Browser. row by hash and then every row for that user through credential1 sifted once per type, becomes trivial to write over current-state rows, since the sift is a group-by with no ranking, and lands in this sprint or immediately after it, closing the ttd on attachState.

### level2 after

The query family gains a delete verb, queryDelete(table, cells), filtering through applyQueryCells exactly as queryHide does today, json paths included, so a caller that hid by these cells deletes by the same ones. It gains an update that edits several cells by the same filters, since queryUpdateCells edits one column by one column's match and the conversion wants a row's stage and json edited together by user, type, and address. Every helper drops its hide filter. checkQueryFillRows fills two margins. queryHide leaves. The counting helpers stop saying including hidden, because there is no longer another kind. The adapter's delete branch gets reached, and the three grid tests that hide example_table rows delete them instead.

### Every table's margins and indexes

hide leaves every table, cloud and registry alike, and the margin triad becomes a pair: row_tag and row_tick. The seventeen cloud indexes that name it are rebuilt without it, same columns, same purpose, each under a new number per the rule that a number is never reused: credential16 onward, delay3 and 4, ledger8 through 13, settings2, trail3 and 4. settings1 becomes a plain unique index under its new number. ledger7 never named hide and stays. The registry-only tables, example_table, profile_table, and user_table, lose the column and example1 in the same commit, with no migration, which is what registry-only means.

### The record tables

trail_table, delay_table, and ledger_table are already what they will be, append-only records, and lose nothing but the column. One thing on trail_table becomes real: its expiration column, which means the tick at which a row could be removed and which every production write sets to zero today, meaning keep forever. Under ordinary deletion the trail's writers set it per message, the horizon each message is counted within, twenty minutes for an answer and a wrong guess, five days for an opened address, and a housekeeping sweep deletes rows past it. That sweep is one job with three tenants: expired trail rows, the Challenged. rows nobody came back to, across every type, and later the quiet anonymous identities anonymous-users.md needs deleted. Where it runs is a decision below; the worker has no cron trigger today.

### The choreography

migration.md's playbook, applied to a change of row meaning rather than a change of columns. The steps, in order, each named by what it does.

1. **The ledgerathon lands and soaks.** Every mutation writes its row for at least a week of real use before any credential row is deleted, so the first rows to go are rows the ledger already describes better.
2. **The survey.** Read-only, against the hosted table: group credential rows by type, stage, hide, and identity, and list the winner per identity by the rule today's readers apply, highest stage then newest. The collapse must leave exactly the rows the deployed code would have chosen anyway, and the survey is where that is checked against the data rather than the code.
3. **The history backfill and the collapse.** One data-only migration: for every credential row that will be deleted, every hidden row and every visible row that is not its identity's winner, insert a ledger row carrying the old row whole in json with its original tick, then delete those rows. Deployed code keeps working unchanged, because a rank over one row is that row, and the visible lone mentions stay until the code switch stops reading them. Rehearsed in PGlite on planted rows for every combination the survey found, run twice, the second pass changing nothing.
4. **The expansion push.** Add the hide-free indexes under their new numbers, and set a scaffolding DEFAULT 0 on hide in every table, so an insert stays whole the moment deployed code stops sending the column.
5. **The code deploy.** One deploy for every table, since the helpers serve them all: level2 loses hide and gains delete and update, level3's writers edit and delete and write their ledger rows, readers drop the collapse, and mentions go to the ledger only. A small data-only push after it deletes the mention rows the readers no longer see, and the stale challenges the sweep would otherwise reach first.
6. **The contraction push.** Drop the hide column from every cloud table, which takes the seventeen old indexes with it, and drop the scaffolding default. The registry shows the final shape in the same commit, and a drift check closes it, columns matched by name and exact inside indexes.
7. **The document sweep.** database-stack.md's shape section, tables.txt's lines about ledgers and hiding, data-cleanup.md's three-patterns section, which this sprint settles and which leaves with it, ledger.md's what-to-do-for-now, and credential.md's hide-does-the-work section.

The one-deploy-or-two rule collapses to one, because no column is added and the collapse makes the old code and the new code agree on what the table holds before either changes. The expansion push must precede the deploy, since code that stops sending hide inserts into a NOT NULL column with no default until the default exists, and the collapse must precede the deploy, since readers that stop filtering hide would otherwise see the hidden rows.

### Testing and smoke

The grid suite gets simpler and stricter at once. Every flow test asserts exact row counts, since there are no invisible rows to reason around: a remove leaves zero rows, close account leaves zero credential rows and the expected ledger rows, a second sign-in at a browser leaves one session, a resend leaves one challenge. The unique indexes get tests that insert around the flow functions and expect 23505. The collapse migration gets its rehearsal test. The deployed smoke is every credential flow on a fresh browser, sign-out everywhere across two browsers, close account, and then the dashboard: credential_table readable at a glance, about three dozen rows, no hide column.

## The documents and notes that change

database-stack.md's how-a-table-is-shaped section describes two margins and says that a row leaves by deletion. tables.txt is corrected in place at the lines that state the old rule, and the account-lifecycle sketch there, hidden and closed as states a staff member could set, is noted as a future column or row and never a hide. data-cleanup.md's three-patterns section leaves with the question it sized, and the document shrinks toward its last open items. ledger.md's provisional decision becomes the record of the reasoning behind a migration that happened. credential.md's events-and-audit-trail section describes what runs. testing.md's adapter description notes that the delete branch is reached. migration.md gains one paragraph, the variant proven here: a change of row meaning, where the data collapse runs before the code switch so old and new code agree on the table.

## Decisions the sprint must make

Each with a recommendation, none taken.

- **row_tick on backfilled history rows.** The original row's tick, with backfilled true in json, so the timeline reads in order under ledger2 and ledger4. The alternative, the migration's moment, would pile a year of history at one tick.
- **A challenge beside a proof for the same address.** Allow the pair, as described. The alternative, the challenge riding the proof's json, hides a flow in flight inside a credential held.
- **A resend.** Delete and insert, so row_tick means when the row was added everywhere. The alternative, editing row_tick in place, gives one column two meanings.
- **Stale challenges.** Deleted the moment a flow knows it is over. The start nobody came back to is ignored at read as today and deleted by the sweep. Reads stay reads.
- **The sweep's home.** A Cloudflare cron trigger on the worker calling one housekeeping function, over a staff-only endpoint hit from outside or opportunistic deletion inside writes that already run. Recommended, and the first scheduled code in the project.
- **Which unique indexes.** The seven named in the dividend. Each one closes a race a read-then-check leaves open.
- **What the credential row's row_tick means once rows are edited.** When the row was inserted, and nothing more; the moment a challenge became a proof is in the ledger. No updated-tick column. Recommended.
- **Whether the two-query snapshot lands in this sprint or right after.** After, as its own small pass, so the conversion's diff stays about the conversion.

## What this document leaves alone

The ledgerathon, planned in ledgerathon.md, whose rows this sprint assumes are already being written. The anonymous-users decision, though the sweep this sprint builds is the expiry job that document needs. Sign-up and the intercredential flows, which change who calls the flow functions and not what they write. Robin, which reads what the ledgerathon writes and is planned wherever robin is planned. The smaller dog, which runs third, after both sprints here, and whose turnstile conversion is the ledgerathon's now. And the suspended-account state tables.txt once sketched: nothing today suspends an account, and when something does it will be a column or a row, never a hide.
