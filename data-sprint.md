# data sprint — session handoff

Start-here orientation for resuming the jsonb sprint in a fresh session. The goal for this session is to run the actual hit_table migration; everything before it — the capability, the research, the reference docs — is finished and committed. Read this, then the documents it points to, and pick up at "the next action" below.

Use Fable 5 for this work.

## Where we are

The sprint adds jsonb as an approved database column type (column titles ending `_json`, or bare `json`), and its first real use converts hit_table's two stringified-JSON text columns to real jsonb.

**Done and committed** (through the `Ceil05` seal):

- **Step 1 — the capability.** json is an available cell type in level2 alongside `_text`, `_tag`, `_hash`, and integers: `isQueryJson` and its `_jsonValue` walker with unit tests, the `'json'` dispatch branch, example_table's `some_json JSONB` column (example_table exists only in PGlite, so this needed zero cloud DDL), grid tests proving object round-trip and canonicalization and write-path refusals, the FakeSupabaseQueryBuilder binding objects as printed text, and tables.txt documenting the type. The suite is green; it deploys without changing any live behavior, because nothing production-side uses json yet.
- **The supabase CLI is set up** — installed, logged in, linked to the real1 project, drift-check capability proven. Migration flow and Docker's role are understood.
- **A drift check ran clean** — the live cloud schema matches the SQL() registry exactly for all six cloud tables; the registry is a deliberate superset (example_table, address_table, user_table, profile_table exist only in the registry).
- **The grid tests moved** out of the level files into icarus/grid.js, imported only by root test.js.

**Not done — the actual migration.** This is the session's work: run hit_table through the expand-and-contract choreography, converting `geography_text`/`browser_text` to `geography_json`/`browser_json`, then refactoring recordHit and report.js to write objects.

## Read these, in this order

1. **jsonb.md** — the sprint's own planning document and the primary read. Holds the whole plan: why hit_table is the first target, the naming decision (`_json`, backed by JSONB), the round-trip / never-rehash rule, the grid-system mechanics, the efficiency research, and — most important for this session — the **five-phase expand-and-contract migration** with its exact SQL, per-phase rollback stories, and the registry-lockstep rule. The "Verified: the registry matches the cloud" and step-1-done marks are in here too.
2. **database-stack.md** — reference for how the database stack works: the four protocol layers (SQL with its DDL/DML split, the Postgres wire protocol, PostgREST's HTTP grammar, supabase-js), every path from code to a table (worker, one-off scripts, grid/PGlite, dashboard, CLI with and without Docker), a choosing-a-path guide, the Key() seal design, and the "Row-level security" section — the live audit and the planned RLS hardening that is this sprint's first migration. Read this to understand which tool does what (especially that `db push` and `db query` need no Docker, only the `db dump` drift check does) and to hold the RLS mechanics before writing that migration.
3. **ledger.md** — broader context the sprint sits inside: the ledger-vs-traditional and audit-table questions, and the jsonb question (now marked answered, pointing here). The future k1–k8 collapse on credential_table is the sprint's eventual sequel, riding on the pattern this migration proves.
4. **testing.md** — the grid()/test() system and the record of the grid.js move, if the test architecture needs context.

Auto-memory already carries the compressed versions: `project_jsonb_sprint.md`, `project_supabase_cli.md`, `project_inline_tests.md`.

## The next action

Two migrations are queued, and the **RLS hardening goes first** — it's a genuine security gap-closer and a zero-risk rehearsal of the exact `migration new → db push` flow hit_table needs. An audit (in database-stack.md, "Row-level security") found RLS disabled on all six tables while the `anon`/`authenticated` roles hold full grants including over credential_table, so the app's safety currently rests on a single wall (the anon key never having left the dashboard) with no backstop. The fix: one migration file enabling RLS on all six tables with zero policies, plus optionally revoking the anon/authenticated grants — `service_role` carries BYPASSRLS (verified), so the worker, local dev, scripts, and PGlite tests are all untouched, and the change ends the advisor emails. The SQL() registry notes the RLS state in the same commit. Read the database-stack.md section for the full mechanics before writing the file.

Then the jsonb work. Phase 1 of the hit_table migration, **expand** (schema only), per jsonb.md:

1. Write the migration file: `supabase migration new hit_table_json`, containing the four ALTERs — add `geography_json` and `browser_json` as `JSONB NOT NULL DEFAULT '{}'`, and set `geography_text` and `browser_text` to `DEFAULT ''`. The defaults are temporary scaffolding so both old and new code can insert during the window; they leave in phase 4.
2. Make the **lockstep registry edit** in level3's hit_table SQL() block in the same commit, so the registry mirrors production.
3. Kevin runs `supabase db push --dry-run` then `supabase db push` (he runs all push/deploy/git/system commands; Claude writes the files and can read the live table read-only — `supabase db query --linked` or the icarus-plus-Key() script pattern — to verify rows before and after).

Then phases 2–5: verify, migrate the code (recordHit + report.js write objects, first hit_table grid test), contract (drop the text columns and the json defaults), and a closing drift check.

hit_table is the gentle first migration because it has zero readers — every risk is on the write path, which the defaults cover. A naive mismatch would error on every page load (recordHit runs on the Hello. every visit sends), which is exactly why expand-and-contract is used rather than a big-bang swap.

## Working conventions

- Kevin runs all git commits, deploys, `supabase db push`, and system-wide commands (brew, Docker) himself; Claude proposes and reviews output. Claude writes repo files and reads the live database read-only.
- Each migration file and its SQL() registry edit land in the same commit.
- Docker is needed only for the `db dump` drift check, not for `db push`. It can stay closed until then.

## Parked, non-blocking

- **database-stack.md is uncommitted** in the working tree as of this handoff — commit it alongside this document.
- level2 still imports `pgliteDynamicImport`, now unused there after the grid.js move — prunable, low priority.
- jsonb.md and these newer docs have no lines in contents.md yet (the credential-doc index) — deferred pending a possible rename/combine.
- **xray** — a stubbed-out out-of-band system to confirm what gets built into bundles (secrets verification). Kevin flagged it as worth looking at when the migration work reaches a resting point; a good capstone to the secrets-management context.

(The RLS hardening, formerly parked here, is now a planned first step — see "The next action" above.)
