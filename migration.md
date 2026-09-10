# migration

How a live table changes shape while the application runs against it. The pattern is expansion and contraction: the new shape arrives beside the old, code crosses from one to the other in deploys, data translates in place, and the old shape leaves. Worker deploys and database pushes are always separate events that can never land in the same instant, so every step is shaped so the order of any adjacent pair can't break a write or a read.

## The choreography

**The expansion migration** adds the new columns beside the old, with scaffolding DEFAULT clauses on both generations: the new columns' defaults fill blanks until deployed code starts sending real cells, and the old columns get SET DEFAULT so that when code later stops sending them, inserts stay whole. Without the old columns' defaults there is no safe order at the far end — deploy first and inserts omit NOT NULL columns that have no default; push first and the still-deployed worker inserts into columns that no longer exist. New indexes ride along here, cheaply indexing blanks until the data arrives.

**The dual-write deploy** has every write fill both generations within the same row. This splits the migration problem by date: every row born after this deploy is already in the final shape, so the backfill only has to translate rows born before it, and the two never race.

**The data migration** translates the old rows, under three disciplines. A read-only survey first: group production rows and report which cells each combination actually uses — testing the plan against what the table holds rather than what the code suggests — and run any casts read-only across every value before the migration file is written. Then one idempotent UPDATE per shape, each behind a blank-cell guard that skips rows the dual-write already filled; hidden rows translate too, because the contraction takes the old columns from every row. Then a grid rehearsal: the registry holds both column sets during the window, so PGlite builds the transitional schema, and a scaffolding test plants synthetic old-shape rows for every combination the survey found, runs the migration files' statements verbatim, and asserts every translation — then runs them again, because a second pass must change nothing. Verification after: per shape, zero rows where the new cells are blank while old cells are not.

**The read-switch deploy** moves reads to the new columns and drops the old cells from writes entirely, the expansion's defaults covering the blanks from here to the end. Reads keep their return shapes, so callers above see nothing change.

**The contraction migration** drops the old columns — their indexes fall with them automatically — and drops every scaffolding default, returning the table to house style: every column NOT NULL, no defaults, every cell provided explicitly. The deployed worker stopped mentioning the old cells at read-switch, so this push pairs with no code change and its timing can't break anything. The registry shows the final shape in the same commit, per the lockstep rule, and a drift check closes the dance — columns matched by name, exact inside indexes and constraints.

## One deploy or two

When nothing reads the converting columns — a table of records written and rarely queried — the dance collapses to one deploy: code switches to writing the new columns, and the contraction migration carries the backfill inline before the drop. Live readers are what force reads and writes to switch in separate deploys, with the data migration between them.

## A data-only migration

When only the contents of cells change and no column does, there is no expansion and no contraction. One migration file holds one UPDATE, and it is pushed once. The one thing to decide is the order of the push and the deploy. Deploy the code that writes the new value first, then push the UPDATE, so a row written between the two is caught by the update instead of being left with the old value. First done in September 2026, when the ledger's Validated. rows became Proven.

## When a new column must be mandatory

The variant for a column every future row must carry, on a table that already holds rows that cannot. A CHAR or a NOT NULL column has no honest value for the past, and inventing one per row would be fabricating data. So choose a single placeholder instead: shaped like a real value so every guard the code already has accepts it, and unmistakable on sight so nobody mistakes it for one, the way twenty-one zeros stand for the requests that ran before doors carried tags.

The placeholder then does two jobs from one line. ADD COLUMN with it as the DEFAULT fills every existing row as the column arrives, so the expansion needs no backfill statement and no data migration follows it. And it covers the window between that push and the deploy, when the worker still running inserts rows that never mention the cell. The contraction drops the default, and from that moment an insert that omits the column fails, which is the point of the exercise: the rule moves out of the code and into the database. Note what the database does and does not hold afterward, since a CHAR column blank-pads an explicitly empty string rather than refusing it; the schema enforces that a value is present, and the application's check keeps enforcing that the value is real.

Two columns can share one contraction when they reach that point together, which saves a push. First done September 2026, when ledger_table gained door_tag as a mandatory cell and tag_text as an optional one, and both scaffolding defaults retired in the same file.

## When a matching key changes form

The variant for when a value that lookups filter on changes spelling — a case change, a normalization. Either single-form order breaks matching during its window: matching only the new form misses old rows before the backfill converges them, and backfilling first makes old-form matching miss converted rows. So the dual-write deploy writes the new form while its lookups match both spellings, the backfill converges the old rows, and the read-switch narrows matching to the new form alone.
