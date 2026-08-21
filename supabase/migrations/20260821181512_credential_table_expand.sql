-- Expand phase of the credential_table k collapse: the two destination columns arrive beside
-- the k slots they will retire -- hash_text for the row's one meaningful hash (Browser.'s browserHash
-- and Password.'s password hash), note_json for the payload bag of everything else -- so old and new
-- code can both insert during the window. Every DEFAULT here is temporary scaffolding: the new
-- columns' until the dual-write deploy sends real cells, the k columns' so inserts stay whole after
-- the read-switch deploy stops sending them. All of them leave with the contract migration.
ALTER TABLE credential_table ADD COLUMN note_json JSONB NOT NULL DEFAULT '{}';
ALTER TABLE credential_table ADD COLUMN hash_text TEXT  NOT NULL DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k1_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k2_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k3_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k4_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k5_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k6_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k7_text SET DEFAULT '';
ALTER TABLE credential_table ALTER COLUMN k8_text SET DEFAULT '';

-- The two indexes that will replace credential5 through credential12: a plain partial for the
-- Browser. signed-in lookup, and an expression index for the oauth claim's identifier path --
-- spelled ->> with no casts, the one spelling level2's query filters generate, so the index always
-- matches the query. They index a few thousand blank cells until the backfill, which costs nothing.
CREATE INDEX credential13 ON credential_table (hide, type_text, hash_text) WHERE hash_text != '';
CREATE INDEX credential14 ON credential_table (hide, type_text, (note_json->>'identifier')) WHERE note_json->>'identifier' IS NOT NULL;
