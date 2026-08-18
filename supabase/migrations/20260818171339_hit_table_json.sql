-- Expand phase of the hit_table json conversion: add the two json columns beside
-- their text siblings, so old and new code can both insert during the window. The DEFAULT clauses
-- are temporary scaffolding -- deployed code doesn't send the json cells yet, and after the code
-- deploy the retired text cells stop arriving -- both defaults leave with the contract migration.
ALTER TABLE hit_table ADD COLUMN geography_json JSONB NOT NULL DEFAULT '{}';
ALTER TABLE hit_table ADD COLUMN browser_json   JSONB NOT NULL DEFAULT '{}';
ALTER TABLE hit_table ALTER COLUMN geography_text SET DEFAULT '';
ALTER TABLE hit_table ALTER COLUMN browser_text   SET DEFAULT '';
