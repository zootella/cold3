# data tasks

The queue of data-layer work: none of it difficult, each task multiple turns, done in an order we choose. Pick one; the others stay recorded and ready. Live-table changes ride the proven migration flow — migration.md holds the playbook, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## smaller dog

Shrink the Datadog and logging apparatus to almost nothing, planned in smaller-dog.md: the ledgerAdd conversions that lead the sprint are two of three in — the message task writes its MessageSent. row alone, both oauth sites write ledger rows beside the old audit, and turnstile waits on the layering decision — and then a removal pass takes the function suite, the double-hulled door catches, the keepPromise parking lot, and the pluggable log sinks, leaving one async dog. The document holds the inventory, where each of the old four purposes goes, and the decisions the sprint must make — dog's destination, the attention channel, the layering seam, audit latency.

## backup plan

Pick from the three approaches presented in database-stack.md's backup-plan section — the plan-gated managed backups, the pg_dump schema-and-data pair, the CSV cold copy — which combination, on what cadence, and where the sensitive files sleep, since a held backup is exactly as sensitive as the database. A likely first move: run the data half of the pg_dump pair once to see the artifact, then design the CSV export script down the scripts path. The sprint also carries a secrets question the two documents only imply together: a held backup is a fourth place secrets live, beside the workstation, the bundles, and the providers' secret services, so whatever encrypts one wants a home in the key system and a tracer family of its own.

## address and service table cleanup

Done August 26, 2026: address_table and service_table left the code, the schema, and the planning documents that mentioned them. service_table was the only one in the cloud — zero rows, nothing referencing it — and went by a single DROP paired with its registry edit; address_table was registry-only, so deleting its `SQL()` block was the whole schema change. Eight functions went with them, along with the ttds and essays that pointed at them. What survives is data-cleanup.md, which holds the design both tables carried and the list of what that design wanted that nothing does yet, each item waiting to be built into credential_table or ledger_table or waived on the record.

## credential table consolidation

Done August 22, 2026: the k slots collapsed into hash_text and note_json by expansion and contraction with two deploys, every station verified, the drift check clean. The playbook the sprint proved lives in migration.md; the doctrine it refined lives in jsonb.md.

## xray

Done August 24, 2026: xray.js became a census tool over ripgrep — a search term in, a list of paths and counts out — and xray.md became the guide to how we manage and secure secrets, holding the tracer families, the expected picture for all three bundles, the provider-side homes, both build pipelines mapped on disk, and a recorded clean run. K10 moved into AWS Secrets Manager along the way, so no build or deploy script carries it on either provider.
