-- Contract phase of the ledger_table vocabulary: the notes move from note_json into json, note_json
-- leaves, and the scaffolding defaults retire, returning the table to house style -- every column
-- NOT NULL, no defaults, every cell provided explicitly. Deployed code has named event_text,
-- provider_text, origin_text, and json on every insert since the deploy, so the defaults have
-- nothing left to fill.

-- Rows born before the deploy hold their note in note_json and {} in json; rows born after hold the
-- reverse, because deployed code never names note_json and its default fills {}. The blank guard on
-- json keeps this copy off the rows the deploy already wrote, and makes a second run change nothing.
-- Hidden rows come along too, because the drop below takes note_json from every row.
UPDATE ledger_table SET json = note_json WHERE json = '{}'::jsonb AND note_json != '{}'::jsonb;

ALTER TABLE ledger_table DROP COLUMN note_json;

ALTER TABLE ledger_table ALTER COLUMN event_text    DROP DEFAULT;
ALTER TABLE ledger_table ALTER COLUMN provider_text DROP DEFAULT;
ALTER TABLE ledger_table ALTER COLUMN origin_text   DROP DEFAULT;
ALTER TABLE ledger_table ALTER COLUMN json          DROP DEFAULT;
