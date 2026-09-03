-- Expand phase of the ledger_table vocabulary: three text columns that name what a row is about,
-- and json arriving to replace note_json. The DEFAULT clauses are scaffolding for the window
-- between this push and the deploy that fills the cells, and they fill the existing rows correctly
-- besides, since blank and {} are exactly what a row written before this knows.
ALTER TABLE ledger_table ADD COLUMN event_text    TEXT   NOT NULL DEFAULT '';
ALTER TABLE ledger_table ADD COLUMN provider_text TEXT   NOT NULL DEFAULT '';
ALTER TABLE ledger_table ADD COLUMN origin_text   TEXT   NOT NULL DEFAULT '';
ALTER TABLE ledger_table ADD COLUMN json          JSONB  NOT NULL DEFAULT '{}';

-- note_json gets a default of its own, so that when the deploy stops naming it, inserts stay whole
-- until the contraction drops it. Without this there is no safe order at the far end.
ALTER TABLE ledger_table ALTER COLUMN note_json SET DEFAULT '{}';

-- Partial the way ledger4 is, and for the same reason: most rows name no event and no provider,
-- and their blanks are not worth indexing. Tick descending beside each word, so "everything of this
-- kind, newest first" is a single index read.
CREATE INDEX ledger5 ON ledger_table (event_text,    row_tick DESC) WHERE hide = 0 AND event_text    != '';
CREATE INDEX ledger6 ON ledger_table (provider_text, row_tick DESC) WHERE hide = 0 AND provider_text != '';
