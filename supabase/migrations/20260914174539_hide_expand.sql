-- Expand phase of removing the hide column from the tables that never used it: trail_table,
-- ledger_table, delay_table, and settings_table. No row in any of them has ever been hidden; the
-- column is filtered by every read helper and filled by every insert, and that is all. hideless
-- takes it out of level2 and out of these four tables, and this push prepares both halves.
--
-- The DEFAULT is scaffolding. The deploy that follows stops sending hide on every insert, and a NOT
-- NULL column with no default would refuse those inserts, so the default holds the window between
-- that deploy and the contraction that drops the column. Nothing reads the value it fills in.
--
-- The indexes are the successors. Every index on these tables names hide, either as its leading
-- column or in a WHERE hide = 0 predicate, and an index built around hide serves no query that
-- doesn't ask about hide, which after the deploy is every query. So each gets a twin under its
-- table's next number, the same columns and the same non-blank predicates with hide taken out,
-- built now beside the old so the deployed code finds them waiting. The old ones fall with the
-- column at the contraction. ledger7 never named hide and stays. trail1, by tick alone, gets no
-- successor: nothing reads trail_table by tick alone, and its stated purpose was hiding or
-- deleting old rows, which a sweep, if one is ever built, would do by expiration.

ALTER TABLE trail_table    ALTER COLUMN hide SET DEFAULT 0;
ALTER TABLE ledger_table   ALTER COLUMN hide SET DEFAULT 0;
ALTER TABLE delay_table    ALTER COLUMN hide SET DEFAULT 0;
ALTER TABLE settings_table ALTER COLUMN hide SET DEFAULT 0;

CREATE INDEX trail3 ON trail_table (hash, row_tick DESC);  -- trail2 without hide: every row about one message, newest first

CREATE INDEX ledger10 ON ledger_table (browser_hash,  row_tick DESC);  -- ledger1 through ledger6, ledger8, and ledger9 without hide, in that order
CREATE INDEX ledger11 ON ledger_table (user_tag_text, row_tick DESC);
CREATE INDEX ledger12 ON ledger_table (action_text,   row_tick DESC);
CREATE INDEX ledger13 ON ledger_table (hash_text,     row_tick DESC) WHERE hash_text != '';
CREATE INDEX ledger14 ON ledger_table (event_text,    row_tick DESC) WHERE event_text != '';
CREATE INDEX ledger15 ON ledger_table (provider_text, row_tick DESC) WHERE provider_text != '';
CREATE INDEX ledger16 ON ledger_table (tag_text,      row_tick DESC) WHERE tag_text != '';
CREATE INDEX ledger17 ON ledger_table (door_tag,      row_tick DESC);

CREATE INDEX delay3 ON delay_table               (task_text, row_tick DESC);  -- delay1 and delay2 without hide
CREATE INDEX delay4 ON delay_table (wrapper_hash, task_text, row_tick DESC);

CREATE UNIQUE INDEX settings2 ON settings_table (setting_name_text);  -- settings1 without hide: setting names are unique
