# data tasks

The queue of data-layer work: none of it difficult, each task multiple turns, done in an order we choose. Pick one; the others stay recorded and ready. Live-table changes ride the proven migration flow — migration.md holds the playbook, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## brownieless

First in the queue as of September 4, 2026, ahead of the smaller dog, and needing no migration. Retire the brownie and the wallet flow's page-held envelope, planned in brownieless.md as a battle plan in three sections, totp, wallet, and otp: the totp secret, the wallet nonce, and the otp challenge move into the database beside the credential_table rows that already record the start of each flow — the browser that started the flow in hash_text, the secret or the nonce in json, the otp answer in the trail as a hash — and then the letter, the door's open and seal, the page's carriage and follow-up, the note vocabulary, and the wallet envelope all leave. Each section shows how the flow works today in every place its data lands, how it works brownieless, the testing and refactoring steps, and notes; every decision is made, with the two-query snapshot deferred to its own exploration after the credential_table pass.

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
