-- Contract phase of the ledger_table hash_text addition: the temporary default retires, returning
-- the table to house style -- every column NOT NULL, no defaults, every cell provided explicitly.
-- Deployed code names hash_text on every insert, a hash or the blank, so the default has nothing
-- left to fill.
ALTER TABLE ledger_table ALTER COLUMN hash_text DROP DEFAULT;
