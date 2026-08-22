-- Contract phase of the credential_table k collapse: the eight k columns retire, their partial
-- indexes credential5 through credential12 falling with them automatically, and the scaffolding
-- defaults retire too, returning the table to house style -- every column NOT NULL, no defaults,
-- every cell provided explicitly. The deployed worker stopped mentioning the k cells at the
-- read-switch deploy, and the backfill translated every row's k values into hash_text and
-- note_json before that, so nothing here is read, written, or lost.
ALTER TABLE credential_table DROP COLUMN k1_text;
ALTER TABLE credential_table DROP COLUMN k2_text;
ALTER TABLE credential_table DROP COLUMN k3_text;
ALTER TABLE credential_table DROP COLUMN k4_text;
ALTER TABLE credential_table DROP COLUMN k5_text;
ALTER TABLE credential_table DROP COLUMN k6_text;
ALTER TABLE credential_table DROP COLUMN k7_text;
ALTER TABLE credential_table DROP COLUMN k8_text;
ALTER TABLE credential_table ALTER COLUMN note_json DROP DEFAULT;
ALTER TABLE credential_table ALTER COLUMN hash_text DROP DEFAULT;
