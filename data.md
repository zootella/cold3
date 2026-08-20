# data tasks

The queue of data-layer work: none of it difficult, each task multiple turns, done in an order we choose. Pick one; the others stay recorded and ready. Live-table changes ride the proven migration flow — expansion and contraction, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## smaller dog

Shrink the Datadog and logging apparatus to almost nothing, planned in smaller-dog.md: the three logAudit call sites convert to ledgerAdd first, then a removal pass takes the function suite, the double-hulled door catches, the keepPromise parking lot, and the pluggable log sinks, leaving one async dog. The document holds the inventory, where each of the old four purposes goes, and the decisions the sprint must make — dog's destination, the attention channel, the layering seam, audit latency.

## backup plan

Pick from the three approaches presented in database-stack.md's backup-plan section — the plan-gated managed backups, the pg_dump schema-and-data pair, the CSV cold copy — which combination, on what cadence, and where the sensitive files sleep, since a held backup is exactly as sensitive as the database. A likely first move: run the data half of the pg_dump pair once to see the artifact, then design the CSV export script down the scripts path.

## credential table consolidation

The k1–k8 collapse, now planned in full in credential-migration.md: eight positional text columns and their eight partial indexes become named properties in one note_json cell, by expansion and contraction with two deploys, a per-type backfill, and json-path filtering built into level2 first. The f columns stay — f0 and f2 are live uniqueness margins, and f1 rides with its validate* family. This is the selected current task.

## xray

Related to the security of the database; the user will explain the scope. The stub exists as xray.js, sketched as an out-of-band system to confirm what gets built into bundles, a capstone to the secrets-management context.
