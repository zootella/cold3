# data tasks

The queue of data-layer work: none of it difficult, each task multiple turns, done in an order we choose. Pick one; the others stay recorded and ready. Live-table changes ride the proven migration flow — migration.md holds the playbook, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## proven rename

First in the queue as of September 5, 2026, ahead of brownieless. The word for "the user proved control of this address" was validated in some places and proven in others, and it becomes proven everywhere, in two passes. The first pass is done, deployed and pushed September 6, 2026: comments and documents say proven, the oauth handler writes Proven. instead of Validated. into ledger_table, the function credentialOtpValidated became credentialOtpProven, and one migration updated the five ledger rows that said Validated., with the read-back showing five Proven. and none left. That migration changed no column, so it was one push, not an expansion and a contraction, and the code deployed first so a sign-in between the two would have been caught by the update. The second pass, next: credential_table's event column, which holds the numbers 2, 3, and 4, becomes event_text holding Mentioned., Challenged., and Proven., by expansion and contraction on migration.md's playbook. The plan, in the playbook's order:

1. The expansion migration. Add event_text as TEXT NOT NULL with a default of blank, so rows written by the old code stay whole. Give the old event column a default too, 0, so that when the code later stops sending it, inserts still work. No index names event, so no index changes. The registry in level3.js shows both columns in the same commit.
2. The dual-write deploy. Callers of credentialSet pass the tag instead of the number, in all thirty-six places. credentialSet checks the tag is one of the three, a new checkEvent with a hasEvent twin, derives the number from it, and writes both columns. Reads still use the number, which every row has. The grid tests can start asserting on event_text here, since the registry has both columns.
3. The backfill migration. A read-only survey first, which the census already gave: the table holds events 2, 3, and 4 only, no 1. Then one UPDATE that sets event_text from event with a CASE for the three values, guarded to rows where event_text is still blank, hidden rows included. The CASE has no ELSE, so an unexpected number would make the migration fail rather than write a blank. A grid rehearsal runs the same statement against old-shape rows in PGlite before the file is pushed.
4. The read-switch deploy. Every read filters by event_text and the tag: the per-type gets, the holder checks, the hides, and the visible-challenge check at proof time. The collapse in credentialOtpGet ranks the three tags with a small map in place of the greater-than. The objects the page receives keep the property name event, the way the ledger's JavaScript names its event_text, and its value is now the tag, so the two panels compare to 'Proven.' and 'Challenged.'. credentialSet stops writing the number; its default covers the column until it drops.
5. The contraction migration. Drop event and drop event_text's default. The registry shows the final shape in the same commit, and the drift check closes it.

Then brownieless.md's examples change from event with a number and a parenthetical to event_text with the tag.

## brownieless

Second in the queue as of September 5, 2026, behind the proven rename and ahead of the smaller dog, and needing no migration. Retire the brownie and the wallet flow's page-held envelope, planned in brownieless.md as a battle plan in three sections, totp, wallet, and otp: the totp secret, the wallet nonce, and the otp challenge move into the database beside the credential_table rows that already record the start of each flow — the browser that started the flow in hash_text, the secret or the nonce in json, the otp answer in the trail as a hash — and then the letter, the door's open and seal, the page's carriage and follow-up, the note vocabulary, and the wallet envelope all leave. Each section shows how the flow works today in every place its data lands, how it works brownieless, the testing and refactoring steps, and notes; every decision is made, with the two-query snapshot deferred to its own exploration after the credential_table pass.

## smaller dog

Shrink the Datadog and logging apparatus to almost nothing, planned in smaller-dog.md: the ledgerAdd conversions that lead the sprint are two of three in — the message task writes its MessageSent. row alone, both oauth sites write ledger rows beside the old audit, and turnstile waits on the layering decision — and then a removal pass takes the function suite, the double-hulled door catches, the keepPromise parking lot, and the pluggable log sinks, leaving one async dog. The document holds the inventory, where each of the old four purposes goes, and the decisions the sprint must make — dog's destination, the attention channel, the layering seam, audit latency.

## backup plan

Researched and tabled, September 4, 2026, until much later. This was a research task, and the research is done: database-stack.md's backup-plan section records three good approaches — the pg_dump schema-and-data pair the CLI already half runs, the CSV cold copy down the scripts path, and Supabase's plan-gated managed backups — and what they establish is the confidence the sprint was after. We hold a variety of ways to back up, none of them ties us to Supabase as a vendor, and none of them needs the platform's turnkey and expensive options. Nothing waits on the choice, so it stays out of the queue's ordering, and it should not come up again until we deliberately pick it up. What remains for that day is the choosing: which combination, on what cadence, and where the sensitive files sleep, since a held backup is exactly as sensitive as the database — a fourth place secrets live, beside the workstation, the bundles, and the providers' secret services, so whatever encrypts one wants a home in the key system and a tracer family of its own.

## hit melt

Done September 4, 2026: hit_table melted into ledger_table over five tasks — the vocabulary of action, event, and provider tags with a json column; credential_table's note_json renamed json; hit_table's 2,871 rows moved in as Hit. records under ledger7 and the table dropped; and the client's four facts, ip, origin, geography, and browser, on every row from the door, which now rides in AsyncLocalStorage for any code below it. Three doors now, doorWorkerLite joining for hosted modules like @auth/core. Every migration rode migration.md's playbook with a rehearsal where data moved, and the drift check closed clean at fourteen columns. The sprint's document, hit-melt.md, retired into contents.md.

## address and service table cleanup

Done August 26, 2026: address_table and service_table left the code, the schema, and the planning documents that mentioned them. service_table was the only one in the cloud — zero rows, nothing referencing it — and went by a single DROP paired with its registry edit; address_table was registry-only, so deleting its `SQL()` block was the whole schema change. Eight functions went with them, along with the ttds and essays that pointed at them. What survives is data-cleanup.md, which holds the design both tables carried and the list of what that design wanted that nothing does yet, each item waiting to be built into credential_table or ledger_table or waived on the record.

## credential table consolidation

Done August 22, 2026: the k slots collapsed into hash_text and note_json by expansion and contraction with two deploys, every station verified, the drift check clean. The playbook the sprint proved lives in migration.md; the doctrine it refined lives in jsonb.md.

## xray

Done August 24, 2026: xray.js became a census tool over ripgrep — a search term in, a list of paths and counts out — and xray.md became the guide to how we manage and secure secrets, holding the tracer families, the expected picture for all three bundles, the provider-side homes, both build pipelines mapped on disk, and a recorded clean run. K10 moved into AWS Secrets Manager along the way, so no build or deploy script carries it on either provider.
