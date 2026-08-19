-- Contract phase of the trail_table addition: the temporary defaults retire, returning the table
-- to house style -- every column NOT NULL, no defaults, every cell provided explicitly. Deployed
-- code names both columns on every insert, so the defaults have nothing left to fill.
ALTER TABLE trail_table ALTER COLUMN expiration DROP DEFAULT;
ALTER TABLE trail_table ALTER COLUMN json       DROP DEFAULT;
