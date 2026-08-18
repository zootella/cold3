-- Contract phase of the hit_table json conversion (see jsonb.md): the text columns retire, and the
-- temporary defaults retire with them, leaving the table in house style -- every column NOT NULL,
-- no defaults, every cell provided explicitly.

-- First carry the history the text columns still hold across into the json ones. That text is
-- makeText output, which is valid JSON, so the cast just works. The guard matters: rows written
-- since the code deploy hold a blank there, and '' is not valid JSON, so casting one would error.
UPDATE hit_table SET geography_json = geography_text::jsonb WHERE geography_text != '';
UPDATE hit_table SET browser_json   = browser_text::jsonb   WHERE browser_text   != '';

ALTER TABLE hit_table DROP COLUMN geography_text;
ALTER TABLE hit_table DROP COLUMN browser_text;
ALTER TABLE hit_table ALTER COLUMN geography_json DROP DEFAULT;
ALTER TABLE hit_table ALTER COLUMN browser_json   DROP DEFAULT;
