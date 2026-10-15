-- Expand phase of removing the hide column from credential_table, the last table that has it. Every
-- credential type's code now edits a row when its data changes and deletes it when its absence is
-- the truth, deployed September 25, 2026, so nothing deployed hides a row or inserts a new one
-- beside a hidden one. This push takes out the rows the old code left behind, adds the indexes the
-- new code earned, and prepares the deploy that stops mentioning the column.
--
-- The deletes are rules, and the survey of September 25, 2026 sized them: of 220 rows, 177 were
-- hidden, 5 visible rows said Mentioned., and 4 visible challenges were stale, leaving 34 proofs
-- across 11 accounts. A hidden row is one the old code replaced or removed, and its history is the
-- ledger's job now, so no ledger row is written for it. A Mentioned. row recorded that an address
-- was typed, which the ledger records today. A challenge lives for twenty minutes in every flow, so
-- one older than that at the moment this runs is a flow nobody came back to; one inside its twenty
-- minutes is in flight and stays. The survey found no identity with two visible proofs, so no row
-- loses to a newer one and the unique indexes below create on the first try; had there been one,
-- CREATE UNIQUE INDEX would refuse it and the file would roll back whole.
--
-- The unique indexes turn the rules the code enforces by reading first into constraints the table
-- enforces itself, closing the race a read-then-check leaves open: one session per browser hash;
-- one name, one password, and one totp per user, the totp in either stage; one holder per proven
-- name, address, or wallet; and one account per oauth identity, keyed on the provider and the
-- identifier together, since identifiers from different providers may collide. A name's display
-- form needs no index of its own: two names with one display form have one normalized form. Oauth.
-- rows stay out of the holder index: their f0 is the address the provider reported, and two
-- providers may report the same one for the same person.
--
-- The DEFAULT is scaffolding. The deploy that follows stops sending hide on every insert, and a NOT
-- NULL column with no default would refuse those inserts, so the default holds the window between
-- that deploy and the contraction that drops the column. Nothing reads the value it fills in.
--
-- The plain indexes are the successors. Every index on this table leads with hide, and an index
-- built around hide serves no query that doesn't ask about hide, which after the deploy is every
-- query. Each gets a twin under the next number, the same columns and predicates with hide taken
-- out, built now beside the old so the deployed code finds them waiting; the old ones fall with the
-- column at the contraction. credential3, by the formal form f1_text, gets no successor: nothing
-- reads the table by it.

DELETE FROM credential_table WHERE hide <> 0;
DELETE FROM credential_table WHERE event_text = 'Mentioned.';
DELETE FROM credential_table WHERE event_text = 'Challenged.' AND row_tick < (extract(epoch FROM now()) * 1000)::bigint - 20 * 60 * 1000;

ALTER TABLE credential_table ALTER COLUMN hide SET DEFAULT 0;

CREATE INDEX credential16 ON credential_table (user_tag, row_tick DESC);  -- credential1 without hide: every row of a user, newest first
CREATE INDEX credential17 ON credential_table (type_text, f0_text)   WHERE f0_text   != '';  -- credential2 without hide: a name or address by its normalized form
CREATE INDEX credential18 ON credential_table (type_text, f2_text)   WHERE f2_text   != '';  -- credential4 without hide: a name by its display form
CREATE INDEX credential19 ON credential_table (type_text, hash_text) WHERE hash_text != '';  -- credential13 without hide: the Browser. signed-in lookup
CREATE INDEX credential20 ON credential_table (type_text, (json->>'identifier')) WHERE json->>'identifier' IS NOT NULL;  -- credential15 without hide: the oauth claim, spelled ->> with no casts, the spelling level2's filters generate

CREATE UNIQUE INDEX credential21 ON credential_table (hash_text)           WHERE type_text = 'Browser.';  -- one session per browser
CREATE UNIQUE INDEX credential22 ON credential_table (user_tag, type_text) WHERE type_text IN ('Name.', 'Password.', 'Totp.');  -- one name, one password, and one totp per user, the totp in either stage
CREATE UNIQUE INDEX credential23 ON credential_table (type_text, f0_text)  WHERE event_text = 'Proven.' AND type_text IN ('Name.', 'Email.', 'Phone.', 'Ethereum.');  -- one holder per proven name, address, or wallet
CREATE UNIQUE INDEX credential24 ON credential_table ((json->>'provider'), (json->>'identifier')) WHERE type_text = 'Oauth.' AND event_text = 'Proven.';  -- one account per oauth identity
