-- Expand phase of the credential_table rename of note_json to json: the same payload bag arrives
-- under the name ledger_table settled on, beside the column it will retire, so old and new code can
-- both insert during the window. Both DEFAULT clauses are temporary scaffolding: json's until the
-- dual-write deploy sends real cells, note_json's so inserts stay whole after the read-switch deploy
-- stops sending it. Both leave with the contract migration.
ALTER TABLE credential_table ADD COLUMN json JSONB NOT NULL DEFAULT '{}';
ALTER TABLE credential_table ALTER COLUMN note_json SET DEFAULT '{}';

-- credential14's successor for the oauth claim: the identifier path on the new column, spelled ->>
-- with no casts, the one spelling level2's filters generate, so the index matches the query the day
-- the read-switch points the claim at json. It indexes nothing until the backfill fills the column.
CREATE INDEX credential15 ON credential_table (hide, type_text, (json->>'identifier')) WHERE json->>'identifier' IS NOT NULL;
