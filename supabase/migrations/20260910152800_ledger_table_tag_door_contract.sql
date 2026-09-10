-- Contract phase for tag_text and door_tag together, because both reached this point at once.
-- Each arrived with a scaffolding DEFAULT so that inserts stayed whole through the window between
-- its push and the deploy that started filling the cell. Both deploys have landed, _ledgerRow is the
-- only thing that inserts here, and it sends both cells on every row, so the scaffolding has no more
-- work to do. Dropping the defaults returns the table to house style, every column NOT NULL with
-- every cell provided explicitly, and it moves the door tag rule from the code alone into the
-- database: from here an insert that leaves door_tag out fails outright rather than quietly taking
-- zeros. checkTag in _ledgerRow keeps holding the other half of that rule, which is that the value
-- is a real tag and not a blank. The twenty-one zeros stay on the rows written before doors carried
-- tags, meaning exactly what they meant when they arrived.
ALTER TABLE ledger_table ALTER COLUMN door_tag DROP DEFAULT;
ALTER TABLE ledger_table ALTER COLUMN tag_text DROP DEFAULT;
