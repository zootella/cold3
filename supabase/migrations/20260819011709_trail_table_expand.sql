-- Expand phase of the trail_table addition: two columns ready for future callers, none using them yet.
-- The DEFAULT clauses are temporary scaffolding while deployed code inserts without these cells,
-- and they also backfill history correctly, since no expiration and no notes is exactly what old rows hold.
-- Both defaults leave with the contract migration after the code deploy.
ALTER TABLE trail_table ADD COLUMN expiration BIGINT NOT NULL DEFAULT 0;
ALTER TABLE trail_table ADD COLUMN json       JSONB  NOT NULL DEFAULT '{}';
