
# jsonb

json is an approved cell type: a column suffixed `_json`, or titled just `json`, is JSONB holding a plain object of plain data, with `{}` the blank of the cell. tables.txt tells the type's story beside its siblings, and the checks and hashing live in core beside their tests. This document holds the efficiency research and the guidance for deciding future columns; the next adoption is credential_table's k1–k8 collapse, planned in ledger.md.

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

So the answer to the direct question: with the right index, near-equivalent, and jsonb is safe to use where it makes sense rather than only where speed doesn't matter. The cost that remains is planner statistics on unindexed ad-hoc queries and the general loss of SQL-level shape enforcement — the second of which our conventions never leaned on anyway. For our common uses, instance by instance, a tie or a wash — the decision between a dedicated column and a json property is about legibility, constraints, and query patterns, not speed.

Worth naming while we're here: delay_table's d1 through d5, with report.js literally passing `d3: -1, d4: -1, d5: -1` and a comment about room to grow, is the same widening smell as credential_table's k1–k8 — a third instance of the pattern the collapse's template eventually answers. Noted, not scoped.
