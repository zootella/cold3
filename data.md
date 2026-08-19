# data tasks

The queue of data-layer work: none of it difficult, each task multiple turns, done in an order we choose. Pick one; the others stay recorded and ready. Live-table changes ride the proven migration flow — expand and contract, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## trail table expansion

Add two columns to trail_table, ready before any caller uses them:

- `expiration` BIGINT — an integer epoch; 0 means no expiration, a future tick means past that date the row really isn't needed at all anymore.
- `json` JSONB — a place for additional notes; {} when there are none. The first column titled bare json, which the level2 dispatch already supports the way bare hash resolves.

hit_table's flow, made simpler by having no data to convert and no columns to drop:

1. Expand migration: add both columns NOT NULL with temporary defaults, 0 and '{}' — which also correctly backfills every historical row, since no expiration and no notes is exactly what history holds.
2. Code: trailAdd and trailAddMany provide the two cells explicitly, the registry shows the new shape in the same commit, and the trail grid tests exercise it.
3. After the deploy, contract migration: drop the two defaults, returning the table to house style.

Nothing reads the new cells yet; they wait for the caller that needs them.

## new ledger table

ledger_table, the concrete start of the audit-in-our-own-database direction — this is where logAudit content eventually lands, per the Datadog-deprecation thinking in ledger.md. More data-lake storage than active filtering, but some live requests may need to filter, so it starts intentionally ultra-flexible — the kind of table that's possible now that json is a cell type:

```sql
CREATE TABLE ledger_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	user_tag_text  TEXT      NOT NULL,  -- the user involved, or blank if none
	browser_hash   CHAR(52)  NOT NULL,  -- the browser involved
	json           JSONB     NOT NULL   -- everything else about the event; {} if nothing
);
```

A new table is one migration creating it whole — no expand and contract, no temporary defaults, since there are no existing rows or existing callers. Decisions to settle when we pick this up:

- **Which margins earn real columns.** jsonb.md's guidance says anything filtered on lives in its own column. Is there an event- or task-name column for cheap live filtering, or does the kind of event ride in json until a real query arrives and an expression index promotes it? Same question for browser_hash: does every ledger row have a browser (lambda and scheduled work may not), and if not, what does that column hold?
- **Indexes**, decided with the write path — likely (hide, row_tick DESC) and a by-user index, following the neighbors.
- **The grants check.** The schema's default privileges still auto-grant anon and authenticated on newly created tables, so the creation migration should carry its own REVOKE and the RLS enable line — or first close the default-privileges remainder noted in database-stack.md, for which this table is the natural vehicle. Verify grants after creation either way.

## backup plan

Pick from the three approaches presented in database-stack.md's backup-plan section — the plan-gated managed backups, the pg_dump schema-and-data pair, the CSV cold copy — which combination, on what cadence, and where the sensitive files sleep, since a held backup is exactly as sensitive as the database. A likely first move: run the data half of the pg_dump pair once to see the artifact, then design the CSV export script down the scripts path.

## credential table consolidation

The k1–k8 collapse, planned in ledger.md's "collapse k1–k8 into a json cell" section: eight generic text columns and their eight partial indexes become one json payload cell, riding the proven choreography with a per-type backfill. This is the sprint that brings json-path filtering to the level2 query helpers — the helpers generating the one canonical spelling for both the index DDL and the filters.

## delay table

delay_table's d1–d5 is the third instance of the widening smell — report.js literally passes `d3: -1, d4: -1, d5: -1` with a comment about room to grow. Evaluate against jsonb.md's guidance: if the duration slots are read together and rarely filtered, they're a payload bag that folds into a json cell on the same template; if we query them numerically, they're margins and stay columns. Evaluate, then either scope or close.

## xray

Related to the security of the database; the user will explain the scope. The stub exists as xray.js, sketched as an out-of-band system to confirm what gets built into bundles, a capstone to the secrets-management context.
