-- Expand phase of credential_table's event column becoming words: event_text arrives beside event, to hold
-- Mentioned., Challenged., or Proven. where event holds 2, 3, or 4, so old and new code can both insert during
-- the window. Both DEFAULT clauses are temporary scaffolding: event_text's until the dual-write deploy sends
-- real cells, event's so inserts stay whole after the read-switch deploy stops sending it. Both leave with the
-- contract migration. No index names event, so no index changes.
ALTER TABLE credential_table ADD COLUMN event_text TEXT NOT NULL DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN event SET DEFAULT 0;
