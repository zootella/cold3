
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

## Checks: what the json type guarantees

At the same level where we make sure something is an integer before saving it to a table, or make sure something is text, the new check makes sure a value is fit to be a json cell:

- **A plain object at the top.** Not an array, not null, not a string of JSON someone already stringified. Self-describing rows want named keys at the top, and mandating an object also steps around a real driver gotcha: a JavaScript array passed as a query parameter gets serialized as a Postgres array literal, not JSON, and fails against a jsonb column.
- **Round-trip hash equivalence.** The value must survive our own serialization unchanged — its own section below.
- **The blank convention.** `{}` is the blank of json, the way `''` is the blank of text. Columns stay `NOT NULL`.

Open questions for the check's strictness, to decide during implementation:

- **BigInt inside the object.** makeText prints BigInt as numerals in a string, and that round-trips stably — but the type has silently changed from number to string. Toss loudly, or allow the coercion?
- **NaN and Infinity.** JSON.stringify turns them into null, also stably. Same question: is silent null acceptable, or a code mistake worth tossing over?
- **Number magnitude.** JSON numbers read back as JavaScript doubles; integers beyond 2^53 corrupt silently. Our millisecond ticks are around 1.7e12, far inside the safe range, but the rule is worth writing: big identifiers ride as strings inside json cells, never as numbers.

Beyond the check itself, the icarus changes: `recordHit`'s contract takes objects instead of pre-flattened strings, moving the boundary check to where it belongs; report.js drops its two makeText calls; the comments in level2's query check section and hit_table's SQL() block tell the new story; and the read convention gets a sentence — a `_json` column arrives from a select already parsed, so no makeObject on read, ever.

## Round-trip hash equivalence

While `{a:1,b:2}` and `{b:2,a:1}` are the same JavaScript object, they are not the same stringified JSON, and would produce mismatched hashes anywhere we've coded short-circuit logic on hashes of stringified values — which hit_table has: its hourly dedup.

How that dedup actually works today, traced: `recordHit` computes `hashText(roundDown(now, Time.hour) + ':' + makeText(row))` app-side, over the row values before `row_tick` is added, stores it in the neighboring `hash` column, and the `UNIQUE (hash)` constraint plus `queryAddRowIfHashUnique` swallow the duplicate. The hash is minted once, at write, from values the worker holds. It is never recomputed from what the database returns. hit_table will keep this hash column for the same purpose after the conversion.

Two layers of protection keep this sound when objects join the row:

**Our own serialization must be a fixed point.** The json check round-trips the value through makeText, makeObject, makeText, and requires the first and second texts identical. A value whose textual form mutates under our own round trip — whatever exotic thing that turns out to be — never reaches a table. This sits in the check layer exactly beside is-it-an-integer and is-it-text: certainty, established at the trusted boundary, that stringification of this value is stable and deterministic.

**Never rehash what the database returns.** This one can't be a check; it has to be a rule, because jsonb genuinely does not preserve text. Postgres parses the value into a binary tree at write: key order is discarded (jsonb returns keys sorted by length, then bytewise), duplicate keys are dropped, number formatting can change. What you SELECT may stringify differently from what you INSERTed, by design. (Postgres's other type, plain `json`, preserves the exact text but forfeits the binary operators and indexing; we're choosing jsonb and accepting its canonicalization.) So the rule: hashes are computed at write over makeText of the values in hand, stored beside the data, and compared as stored values — never recomputed from a read-back jsonb cell. hit_table already obeys, and always has.

One reassuring detail from the trace: hit_table's hashed row includes `wrapper_hash`, so every deploy already starts a fresh dedup universe — a code change that happened to reorder an object's construction would change hashes anyway, and it never mattered.

## The grid system

`getDatabase()` in simulation mode swaps in `_supafake`, a supabase-api-compatible adapter (`FakeSupabaseQueryBuilder`) wrapping PGlite — real Postgres compiled to WASM — and builds the tables by executing the same `_sql` registry the SQL() calls collect. This is the best possible situation for jsonb: grid tests will exercise genuine jsonb semantics, key sorting and canonicalization included, not an in-memory lookalike's polite imitation. The stub can't lie to us about the very behaviors the round-trip section worries about.

What the sprint verifies here, as a spike with a grid test:

- **Insert.** The adapter passes row values as query parameters; PGlite's driver should stringify a plain object bound to a jsonb column (this is standard node-postgres-family behavior, and the plain-object mandate avoids the array-parameter trap). The real path does the same job differently — supabase-js carries the object in the PostgREST request body. Both are expected to just work; the spike proves it rather than trusting it.
- **Select.** Both paths return the jsonb column as a parsed object. The grid test asserts structural equality, not textual — key order after storage is Postgres's, not ours.
- **A first test for recordHit.** hit_table has no grid test today; the conversion adds one that walks a hit through recordHit against PGlite, reads the row back, and proves the objects arrive as objects and the dedup hash still dedups.

Out of scope this sprint: filtering on json paths (`.eq('json->>provider', ...)`). hit_table has no readers, `checkQueryTitle` would rightly reject an arrow-path title today, and that work belongs to the credential_table adoption when a real query needs it.

## Migrating the live database

Three ways to run DDL against the hosted database:

1. **The Dashboard SQL Editor** — paste and run by hand. The manual path; always works; leaves no record outside the dashboard's history.
2. **The Supabase CLI** — verified against current docs: `supabase login` authenticates through a browser flow, `supabase link` binds the repo to the hosted project by its project ref, `supabase migration new` creates timestamped SQL files in the repo, and `supabase db push` applies unapplied ones to the linked remote project, tracking history in a `supabase_migrations.schema_migrations` table, with `--dry-run` to preview. ([migration docs](https://supabase.com/docs/guides/deployment/database-migrations), [db push reference](https://supabase.com/docs/reference/cli/supabase-db-push))
3. **Direct psql** — the connection string from project settings; raw and always available; no history.

The CLI is the recommendation. It gives Claude the same warm, authenticated reach into supabase that aws and wrangler already give into Amazon and Cloudflare, and migration files in the repo become a versioned record of every DDL change — something the SQL() registry currently approximates by hand. Which raises the discipline this sprint must establish regardless of path: **the SQL() registry text is what PGlite builds, so it must keep matching production** — any live DDL change and its SQL() text change land together, in the same commit, or grid tests quietly diverge from the real schema.

The migration itself, additive first, destructive last:

1. Add the new columns: `ALTER TABLE hit_table ADD COLUMN geography_json JSONB NOT NULL DEFAULT '{}'`, and browser_json likewise. Additive; deployed code doesn't notice.
2. Give the old columns a default: `ALTER COLUMN geography_text SET DEFAULT ''`, and browser_text likewise — so code that stops mentioning them can still insert. (They're `NOT NULL` with no default today; skipping this step makes step 3 fail its inserts.)
3. Deploy the refactored code, which writes objects into the `_json` columns and omits the `_text` ones.
4. Optionally backfill history: `UPDATE hit_table SET geography_json = geography_text::jsonb, browser_json = browser_text::jsonb` — makeText output is valid JSON, so the cast just works. With no readers, we could equally let old rows sit at `{}`.
5. Verify by refreshing the supabase dashboard and watching new rows arrive with real objects in the new columns.
6. Drop `geography_text` and `browser_text`, and update the SQL() registry in the same commit.

hit_table's stakes make this sequence gentle practice; for credential_table the same order will actually be load-bearing.

### Verified: the registry matches the cloud (August 13, 2026)

The first drift check ran ahead of any DDL: `supabase db dump --schema public` (Docker running — the CLI pulls the postgres image matching the remote, 15.1.1.47, cached after the first run) and a reading comparison of the dump against the SQL() registry. Result: all six cloud tables — credential, delay, hit, service, settings, trail — match cell-for-cell and index-for-index: every column name, type, and NOT NULL in order, the six primary keys, all twenty-one secondary indexes with their partial WHERE clauses and the settings1 unique, and hit_table's hit1 unique hash constraint. The registry also declares four tables the cloud doesn't have — example_table (the grid tests' playground, PGlite-only by design), address_table (deprecated, and the cloud side is already clean), and the user_table and profile_table sketches — which sharpens the discipline's wording: the registry is the PGlite schema, a superset of the cloud; for tables that exist in the cloud, the registry must match exactly, and as of this check it does. Rerun the same check after any live DDL — especially right after the hit_table migration, when it becomes the proof that step 2 did exactly what it said.

## Sequencing

Three steps, in order, the first importantly separate:

1. **jsonb becomes an approved type in icarus.** The check function, the dispatch branch, the grid spike proving PGlite and the adapter handle objects, the essay and comment updates. This lands and deploys on its own and changes no live behavior — no table has a json column yet.
2. **The live database migration**, additive steps first, per the sequence above.
3. **The code refactor**: recordHit and report.js write objects, deploy, watch the dashboard, then the destructive DDL and registry sync close it out.

## How far to take jsonb: efficiency, and guidance for future columns

The question that decides future schema design: if we know we'll frequently query a piece of information, must it always get a dedicated column? How much slower is it as a property inside a jsonb column, assuming we build indices appropriately?

The facts, from well-established Postgres behavior:

- **An expression index makes an indexed path read like a column.** `CREATE INDEX ON t ((json->>'provider'))` builds the same B-tree a dedicated text column would get, and a query filtering on that exact expression uses it the same way. For indexed lookups, read performance is essentially equivalent — not an order of magnitude apart, not close to it.
- **Statistics are the honest planner cost.** ANALYZE collects statistics on expression-index expressions, so indexed paths get decent row estimates. Ad-hoc predicates on paths with no index fall back to default selectivity guesses, and the planner can pick worse plans than it would with a real column's statistics.
- **GIN covers the ad-hoc case at a write cost.** A GIN index over the whole column supports any containment or key-exists query without per-path declarations; it's larger and slower to write. Fine for occasionally-queried payloads, wrong for hot narrow lookups.
- **Extraction is cheap until TOAST.** Reading `->>'city'` from a small object is negligible; objects big enough to be compressed out of line (roughly 2KB+) pay a decompression cost per row touched. Our payloads are far below that.
- **Keys repeat per row.** A jsonb object stores its key names in every row; real columns store names once in the catalog. Negligible for a few keys, real for high-volume narrow tables.
- **What jsonb can't do:** per-field NOT NULL and type enforcement at the SQL level (our application checks carry that, which is our doctrine anyway), foreign keys, and being the workhorse for joins and sorts.

The guidance that falls out, for deciding what splays into columns — even when lots of cells might be blank — versus what bundles into a json column where properties are few, well understood, frequently all present, frequently only some present:

- **Margins and identity are always real columns.** row_tag, row_tick, hide, hash, user_tag, type_text, event — anything filtered on, joined, sorted, or unique-constrained lives in its own column, always.
- **A json column is for the payload bag** — keys read together, rarely filtered on, variable in presence, whose shape may differ across rows or types.
- **Promote when a real query arrives.** The day a json property becomes something we filter on, give it an expression index; give it a real column when it also wants constraints, or when legibility warrants. Expression indexes mean promotion is never urgent for speed alone.

So the answer to the direct question: with the right index, near-equivalent, and jsonb is safe to use where it makes sense rather than only where speed doesn't matter. The cost that remains is planner statistics on unindexed ad-hoc queries and the general loss of SQL-level shape enforcement — the second of which our conventions never leaned on anyway.

Worth naming while we're here: delay_table's d1 through d5, with report.js literally passing `d3: -1, d4: -1, d5: -1` and a comment about room to grow, is the same widening smell as credential_table's k1–k8 — a third instance of the pattern this sprint's template eventually answers. Noted, not scoped.
