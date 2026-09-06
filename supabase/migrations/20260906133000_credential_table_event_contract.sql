-- Contract phase of credential_table's event column becoming words: the number column leaves, and event_text's
-- scaffolding default retires, returning the table to house style -- every column NOT NULL, no defaults, every
-- cell provided explicitly. Deployed code has read and written event_text alone since the read-switch, and the
-- backfill gave every older row its word and was verified row for row, so nothing here is still in use.
ALTER TABLE credential_table DROP COLUMN event;
ALTER TABLE credential_table ALTER COLUMN event_text DROP DEFAULT;
