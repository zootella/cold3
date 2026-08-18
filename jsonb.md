
# jsonb

The planning document for approving jsonb as a column type in our database conventions, and for its first adoption: hit_table's two columns that already hold stringified JSON. This is the sprint doc for what ledger.md's "should jsonb be an approved column type" section proposed; the second adoption — collapsing credential_table's k1–k8 — stays planned in ledger.md and waits for this sprint to prove the type.

## The way we do database, and why this sprint exists

level2's conventions are a quite opinionated, intentionally simple subset of everything SQL, the supabase api, supabase, and PostgreSQL can do. Column titles end with their data type. Values are checked correct to those types at write (and maybe someday at read) in our own level2 code, which runs trusted in the worker. We deliberately do not push this enforcement down into SQL — no CHECK constraints, no triggers, no stored procedures — even though you can write your whole application down there, and some braver, older, or mistaken websites have done exactly that, and then found themselves tied to Oracle, essentially: one software and vendor stack. We stay simple, light, and controlled by our own portable JavaScript.

The same instinct shaped the original database choice. For new projects it's fashionable to reach for a document database — sql? tables? that's for older, stuffier, less agile projects — and then vendor lock-in, slower page loads, and large hosting bills are not far behind. So we went with regular sql, regular square tables, regular PostgreSQL, and supabase, and are careful not to make things fancy.

Then we needed a little flexibility, some places. And so today we have columns holding strings that are clearly stringified JSON objects — which can't be right, medium term. Postgres has a first-class type for exactly this. The work of this targeted sprint is to let that type in, on our terms: one new approved cell type, checked at the same trusted boundary as every other, adopted first where the stakes are lowest and the fit is best.

## The first adoption: hit_table

The full stack today: `mainStore.mounted()` posts `Hello.` to `/report` once per page load; `site/server/api/report.js` assembles its three-trust-tier object and flattens two branches to strings — `geographyText: makeText(r.worker.geography)` and `browserText: makeText({agent, ...graphics})`; `recordHit` in level3 checks them as text, computes the hourly dedup hash, and inserts through `queryAddRowIfHashUnique`. Nothing anywhere reads hit_table yet — it's write-only telemetry, with indexes waiting for future queries.

That makes it the ideal first target. The two columns are already jsonb in spirit: variable-presence keys (only country among the cf geography headers is always present), self-describing names, no fixed shape — just trapped in TEXT. Converting them doesn't impose new structure; it declares the structure that's already there, and the makeText flattening at the report.js seam simply disappears — the objects pass through as objects. No readers means no read-path blast radius, and telemetry stakes mean a mistake costs us a few rows of analytics, not a credential. But the write path is the real full stack, page to worker to level3 to level2 to supabase, so it genuinely proves the pipeline before credential_table rides on it.

The columns rename as they retype: `geography_text` and `browser_text` become `geography_json` and `browser_json`.

## Naming: json and _json

The new cell type is named by the suffix `_json`, and a table whose payload column needs no more specific name can title it just `json` — the same way tables now hold hash values in a column titled just `hash`. The dispatch already supports both spellings for free: `_type()` in level2 clips the suffix after the last underscore and returns the whole title when there's no underscore, which is exactly how bare `hash` resolves to the hash check today. `isQueryTitle` needs no change; the existing lowercase-and-underscores rule covers these names.

Decided August 2026, over two alternatives, and the existing conventions decided both. Not `_object`: the suffix vocabulary names the stored thing in the storage world's language — the same rule that made it `text` and not `string` — and object is the JavaScript-side name for the value on its way in and out. Not `_jsonb`: suffixes name our checked cell concept, never the exact SQL type — `_tag` and `_hash` ride on CHAR(21) and CHAR(52) without naming them — and the b is storage engineering that belongs in the DDL beneath the checks, plus a Postgres-specific spelling stamped into every column title forever fights the portability instinct above. So the DDL says JSONB, the binary canonicalizing indexable one, and our vocabulary says json.

## Checks: what the json type guarantees

At the same level where we make sure something is an integer before saving it to a table, or make sure something is text, the new check makes sure a value is fit to be a json cell:

- **A plain object at the top.** Not an array, not null, not a string of JSON someone already stringified. Self-describing rows want named keys at the top, and mandating an object also steps around a real driver gotcha: a JavaScript array passed as a query parameter gets serialized as a Postgres array literal, not JSON, and fails against a jsonb column.
- **Round-trip hash equivalence.** The value must survive our own serialization unchanged — its own section below.
- **The blank convention.** `{}` is the blank of json, the way `''` is the blank of text. Columns stay `NOT NULL`.

The strictness questions, decided during implementation (August 2026) — the rule that settled all of them: toss on anything stringification would quietly change, because a silent conversion inside a payload is a code mistake we want to hear about at the boundary, not discover in a row.

- **BigInt** — refused. It would print as a string of numerals, a silent type change.
- **NaN and Infinity** — refused. They print as null, stably, which is exactly the trap: the round trip can't see the lie, so the walk refuses them first.
- **Integers past 2^53** — refused; they parse back as a different number. Big identifiers ride as strings. (Our millisecond ticks, around 1.7e12, are far inside the safe range.)
- **Dates, Errors, Maps, class instances** — refused by a prototype check, the walk's reason to exist: a Date prints as a string and round-trips stably from then on, so the fixed point alone would bless the conversion it just performed.
- **Circular references** — refused; makeText would print a marker, not data.
- **An undefined array element** — refused; it would print as null.
- **An undefined property value** — allowed, the one deliberate permissiveness: print drops the key, and absent is exactly what undefined means here, matching absent-key-is-the-blank-of-a-property.

Beyond the check itself, the icarus changes: `recordHit`'s contract takes objects instead of pre-flattened strings, moving the boundary check to where it belongs; report.js drops its two makeText calls; the comments in level2's query check section and hit_table's SQL() block tell the new story; and the read convention gets a sentence — a `_json` column arrives from a select already parsed, so no makeObject on read, ever.

## Round-trip hash equivalence

While `{a:1,b:2}` and `{b:2,a:1}` are the same JavaScript object, they are not the same stringified JSON, and would produce mismatched hashes anywhere we've coded short-circuit logic on hashes of stringified values — which hit_table has: its hourly dedup.

How that dedup actually works today, traced: `recordHit` computes `hashText(roundDown(now, Time.hour) + ':' + makeText(row))` app-side, over the row values before `row_tick` is added, stores it in the neighboring `hash` column, and the `UNIQUE (hash)` constraint plus `queryAddRowIfHashUnique` swallow the duplicate. The hash is minted once, at write, from values the worker holds. It is never recomputed from what the database returns. hit_table will keep this hash column for the same purpose after the conversion.

Two layers of protection keep this sound when objects join the row:

**Our own serialization must be a fixed point.** The json check round-trips the value through makeText, makeObject, makeText, and requires the first and second texts identical. A value whose textual form mutates under our own round trip — whatever exotic thing that turns out to be — never reaches a table. This sits in the check layer exactly beside is-it-an-integer and is-it-text: certainty, established at the trusted boundary, that stringification of this value is stable and deterministic.

Implementation sharpened this (August 2026): the fixed point alone would pass values that stabilize *after* one silent conversion — a Date prints as a string and round-trips stably from then on, NaN prints as null and stays null — so a plain-data walk refuses those first, naming each lie precisely, and the fixed point stands behind it as the closing certainty. The walk and the round trip together are `isQueryJson` in level2, with the unit tests beside it as the contract's demonstration.

**Never rehash what the database returns.** This one can't be a check; it has to be a rule, because jsonb genuinely does not preserve text. Postgres parses the value into a binary tree at write: key order is discarded (jsonb returns keys sorted by length, then bytewise), duplicate keys are dropped, number formatting can change. What you SELECT may stringify differently from what you INSERTed, by design. (Postgres's other type, plain `json`, preserves the exact text but forfeits the binary operators and indexing; we're choosing jsonb and accepting its canonicalization.) So the rule: hashes are computed at write over makeText of the values in hand, stored beside the data, and compared as stored values — never recomputed from a read-back jsonb cell. hit_table already obeys, and always has.

One reassuring detail from the trace: hit_table's hashed row includes `wrapper_hash`, so every deploy already starts a fresh dedup universe — a code change that happened to reorder an object's construction would change hashes anyway, and it never mattered.

## The grid system

Since the grid move (August 13), the grid system lives in grid.js: `setupTestDatabase()` dynamic-imports PGlite — real Postgres compiled to WASM — executes the same `_sql` registry the SQL() calls collect via level2's `sqlList()`, wraps the instance in the supafake adapter (`FakeSupabaseQueryBuilder`), and registers the package into level2 with `setTestDatabase()`, which is what `getDatabase()` returns in simulation mode. This is the best possible situation for jsonb: grid tests will exercise genuine jsonb semantics, key sorting and canonicalization included, not an in-memory lookalike's polite imitation. The stub can't lie to us about the very behaviors the round-trip section worries about.

**The spike's vehicle is example_table.** The drift check proved it registry-only — it exists in PGlite and not in the cloud — so it can gain a json column in its `SQL()` block with zero live DDL, and the capability's whole test surface runs before any real table changes: insert an object, read it back parsed, watch the keys canonicalize, watch the check refuse what must be refused.

What the sprint verifies here, as a spike with grid tests:

- **Insert.** The adapter passes row values as query parameters; PGlite's driver should stringify a plain object bound to a jsonb column (this is standard node-postgres-family behavior, and the plain-object mandate avoids the array-parameter trap). The real path does the same job differently — supabase-js carries the object in the PostgREST request body. Both are expected to just work; the spike proves it rather than trusting it.
- **Select.** Both paths return the jsonb column as a parsed object. The grid test asserts structural equality, not textual — key order after storage is Postgres's, not ours.
- **A first test for recordHit.** hit_table has no grid test today; the conversion adds one that walks a hit through recordHit against PGlite, reads the row back, and proves the objects arrive as objects and the dedup hash still dedups.

The insert and select verifications landed with step 1 (August 14): binding needed one line in the adapter — objects print to text, postgres casts the text into the jsonb column — and reading needed nothing, because PGlite parses jsonb back to objects natively. The recordHit test waits for step 3 with the conversion itself.

Out of scope this sprint: filtering on json paths (`.eq('json->>provider', ...)`). hit_table has no readers, `checkQueryTitle` would rightly reject an arrow-path title today, and that work belongs to the credential_table adoption when a real query needs it.

## Migrating the live database

Three ways to run DDL against the hosted database:

1. **The Dashboard SQL Editor** — paste and run by hand. The manual path; always works; leaves no record outside the dashboard's history.
2. **The Supabase CLI** — verified against current docs: `supabase login` authenticates through a browser flow, `supabase link` binds the repo to the hosted project by its project ref, `supabase migration new` creates timestamped SQL files in the repo, and `supabase db push` applies unapplied ones to the linked remote project, tracking history in a `supabase_migrations.schema_migrations` table, with `--dry-run` to preview. ([migration docs](https://supabase.com/docs/guides/deployment/database-migrations), [db push reference](https://supabase.com/docs/reference/cli/supabase-db-push))
3. **Direct psql** — the connection string from project settings; raw and always available; no history.

The CLI is the recommendation. It gives Claude the same warm, authenticated reach into supabase that aws and wrangler already give into Amazon and Cloudflare, and migration files in the repo become a versioned record of every DDL change — something the SQL() registry currently approximates by hand. Which raises the discipline this sprint must establish regardless of path: **the SQL() registry text is what PGlite builds, so it must keep matching production** — any live DDL change and its SQL() text change land together, in the same commit, or grid tests quietly diverge from the real schema.

The migration follows **expand and contract** — the standard zero-downtime choreography, chosen deliberately (August 2026) over a big-bang migrate-and-deploy-together. The principle: code and schema never change at the same time, because deploys are never atomic with anything; instead the schema temporarily speaks both dialects, and each move becomes a small, boring, individually safe step. The stakes are real even here — recordHit runs on the Hello. every page load sends, so a naive mismatch in either direction errors on every visit — and the scaffolding that dissolves them is DEFAULT clauses, temporary by design, leaving with the contract so the schema returns to house style: every column NOT NULL, no defaults, every cell provided explicitly.

**Phase 1 — expand, schema only.** `supabase migration new hit_table_json` creates the timestamped file in supabase/migrations, holding:

```sql
ALTER TABLE hit_table ADD COLUMN geography_json JSONB NOT NULL DEFAULT '{}';
ALTER TABLE hit_table ADD COLUMN browser_json   JSONB NOT NULL DEFAULT '{}';
ALTER TABLE hit_table ALTER COLUMN geography_text SET DEFAULT '';
ALTER TABLE hit_table ALTER COLUMN browser_text   SET DEFAULT '';
```

`supabase db push --dry-run` to preview, then `db push` to apply — run at the user's explicit go-ahead, since it changes production; this first push also creates the CLI's migration history table. All four ALTERs are metadata-only operations in modern Postgres (ADD COLUMN with a default stopped rewriting tables in PG 11), instant at any size. Deployed code doesn't notice: old inserts keep filling the text columns while the defaults fill `{}` into the json ones. Rollback, if ever needed: a new migration dropping the added columns — roll forward, never down; the CLI has no down migrations and neither do we.

**Phase 2 — verify.** A fresh row in the dashboard shows `{}` riding in the new columns; or Docker up for one `supabase db dump` and the normalize-and-diff against the registry.

**Phase 3 — migrate, code only, whenever.** recordHit's contract takes the objects, report.js drops its two makeText flattenings, the first hit_table grid test lands beside the change, deploy — minutes or days after phase 1, no coordination required. New rows carry real objects, with `''` defaulted into the old text columns. During the window the table documents its own transition: every row's wrapper_hash names the deploy that wrote it, so text-era and json-era rows are separated by a visible seam in the data itself. Rollback: redeploy old code, which still works — the text columns remain, defaults intact.

**Phase 4 — contract, schema only, last, the one irreversible step.** After the deploy has soaked:

```sql
ALTER TABLE hit_table DROP COLUMN geography_text;
ALTER TABLE hit_table DROP COLUMN browser_text;
ALTER TABLE hit_table ALTER COLUMN geography_json DROP DEFAULT;
ALTER TABLE hit_table ALTER COLUMN browser_json   DROP DEFAULT;
```

House style restored — and unlike the industry habit of letting `_old` fossils linger for months, the contract actually runs here, because a fossil would sit in the SQL() registry text annoying every reader of level3.

**Phase 5 — the closing drift check**, proving live schema and registry agree at the final shape.

**The backfill — decided yes, August 18.** `UPDATE hit_table SET geography_json = geography_text::jsonb, browser_json = browser_text::jsonb` rides at the top of the phase 4 migration file, before the drops and in the same transaction, converting history — makeText output is valid JSON, so the cast just works. With zero readers it's pure aesthetics, and the aesthetics say uniform: pre-migration telemetry ends as objects rather than sitting at `{}`.

**The lockstep rule threads every phase**: each migration file and its SQL() registry edit land in the same commit — the expand commit shows both column sets with their temporary defaults, the contract commit shows the final shape — so the registry mirrors production at every point in git history, and grid tests exercise each phase's code against that phase's true schema. Mirroring includes column order (decided August 18): ADD COLUMN appends at the physical end and nothing ever reorders, so the registry lists geography_json and browser_json after hash, where the cloud actually keeps them, keeping the drift check's every-column-in-order rule strict; a comment beside the two columns says why they sit apart from their siblings.

hit_table's stakes make this choreography gentle practice; for credential_table the same steps will be load-bearing.

### Verified: the registry matches the cloud (August 13, 2026)

The first drift check ran ahead of any DDL: `supabase db dump --schema public` (Docker running — the CLI pulls the postgres image matching the remote, 15.1.1.47, cached after the first run) and a reading comparison of the dump against the SQL() registry. Result: all six cloud tables — credential, delay, hit, service, settings, trail — match cell-for-cell and index-for-index: every column name, type, and NOT NULL in order, the six primary keys, all twenty-one secondary indexes with their partial WHERE clauses and the settings1 unique, and hit_table's hit1 unique hash constraint. The registry also declares four tables the cloud doesn't have — example_table (the grid tests' playground, PGlite-only by design), address_table (deprecated, and the cloud side is already clean), and the user_table and profile_table sketches — which sharpens the discipline's wording: the registry is the PGlite schema, a superset of the cloud; for tables that exist in the cloud, the registry must match exactly, and as of this check it does. Rerun the same check after any live DDL — especially right after the hit_table migration, when it becomes the proof that step 2 did exactly what it said.

## Sequencing

Three steps, in order, the first importantly separate:

1. **jsonb becomes an approved type in icarus.** The check function, the dispatch branch, the grid spike proving PGlite and the adapter handle objects, the essay and comment updates. This lands and deploys on its own and changes no live behavior — the spike's json column lives on example_table, which exists only in PGlite, so the capability arrives fully tested with zero cloud contact.

   **Done, August 14.** Landed as scoped: `isQueryJson` and its walker in level2 with the demonstration and refusal unit tests beside them, the `'json'` dispatch branch, example_table's `some_json JSONB` column, the five existing grid inserts carrying the explicit `{}` blank, the adapter binding objects as printed text, two grid tests proving parsed round-trip, canonicalized keys, and refusals at the write path, and tables.txt telling the type's story with its siblings. The known unknown resolved the good way: PGlite parses jsonb back to objects natively, so the read side needed nothing.
2. **The live database migration** — the expand phase and its verification, per the choreography above.
3. **The code refactor** — recordHit and report.js write objects, deploy, watch the dashboard; then the contract migration and the closing drift check finish the sprint.

## How far to take jsonb: efficiency, and guidance for future columns

The question that decides future schema design: if we know we'll frequently query a piece of information, must it always get a dedicated column? How much slower is it as a property inside a jsonb column, assuming we build indices appropriately?

The facts, from well-established Postgres behavior:

- **An expression index makes an indexed path read like a column.** `CREATE INDEX ON t ((json->>'provider'))` builds the same B-tree a dedicated text column would get, and a query filtering on that exact expression uses it the same way. For indexed lookups, read performance is essentially equivalent — not an order of magnitude apart, not close to it.
- **Statistics are the honest planner cost.** ANALYZE collects statistics on expression-index expressions, so indexed paths get decent row estimates. Ad-hoc predicates on paths with no index fall back to default selectivity guesses, and the planner can pick worse plans than it would with a real column's statistics.
- **GIN covers the ad-hoc case at a write cost.** A GIN index over the whole column supports any containment or key-exists query without per-path declarations; it's larger and slower to write. Fine for occasionally-queried payloads, wrong for hot narrow lookups.
- **Extraction is cheap until TOAST.** Reading `->>'city'` from a small object is negligible; objects big enough to be compressed out of line (roughly 2KB+) pay a decompression cost per row touched. Our payloads are far below that.
- **Keys repeat per row — except where it matters.** A jsonb object stores its key names in every row it appears in; real columns store names once in the catalog. Negligible for a few keys, real for high-volume narrow tables — but the complaint inverts for sparse fields: an absent key costs nothing at all, while a blank-sentinel `NOT NULL` text column pays its small per-row cost in every row. And absent-key extracts to NULL, so `WHERE (json->>'x') IS NOT NULL` in a partial expression index is the precise analogue of the `WHERE k1_text != ''` pattern the schema uses today, with absent-means-blank arguably cleaner than empty-string-means-blank.
- **One operational trap, neutralized structurally.** An expression index matches only queries that spell the expression exactly as indexed — `->>` versus `->`, casts included. A real trap in raw SQL; not here, because the level2 query helpers will generate the one canonical spelling for both the index DDL and the filters.
- **What jsonb can't do:** per-field NOT NULL and type enforcement at the SQL level (our application checks carry that, which is our doctrine anyway), foreign keys, and being the workhorse for joins and sorts.

The guidance that falls out, for deciding what splays into columns — even when lots of cells might be blank — versus what bundles into a json column where properties are few, well understood, frequently all present, frequently only some present:

- **Margins and identity are always real columns.** row_tag, row_tick, hide, hash, user_tag, type_text, event — anything filtered on, joined, sorted, or unique-constrained lives in its own column, always.
- **A json column is for the payload bag** — keys read together, rarely filtered on, variable in presence, whose shape may differ across rows or types.
- **Promote when a real query arrives.** The day a json property becomes something we filter on, give it an expression index; give it a real column when it also wants constraints, or when legibility warrants. Expression indexes mean promotion is never urgent for speed alone.

So the answer to the direct question: with the right index, near-equivalent, and jsonb is safe to use where it makes sense rather than only where speed doesn't matter. The cost that remains is planner statistics on unindexed ad-hoc queries and the general loss of SQL-level shape enforcement — the second of which our conventions never leaned on anyway. Conclusion recorded from the August 2026 discussion: for our common uses, instance by instance, a tie or a wash — the decision between a dedicated column and a json property is about legibility, constraints, and query patterns, not speed.

Worth naming while we're here: delay_table's d1 through d5, with report.js literally passing `d3: -1, d4: -1, d5: -1` and a comment about room to grow, is the same widening smell as credential_table's k1–k8 — a third instance of the pattern this sprint's template eventually answers. Noted, not scoped.
