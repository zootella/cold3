-- Contract phase of the credential_table rename of note_json to json: the old column leaves, taking
-- credential14 with it, and json's scaffolding default retires, returning the table to house style --
-- every column NOT NULL, no defaults, every cell provided explicitly. Deployed code has read and
-- written json alone since the read-switch, and the backfill copied every older note across and was
-- verified row for row, so nothing here is still in use.
ALTER TABLE credential_table DROP COLUMN note_json;
ALTER TABLE credential_table ALTER COLUMN json DROP DEFAULT;
