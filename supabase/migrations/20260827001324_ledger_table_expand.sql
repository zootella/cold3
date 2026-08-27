-- Expand phase of the ledger_table hash_text addition: one column ready for future callers, none
-- using it yet. It holds the row's one meaningful hash when the row has one, and blank when it
-- doesn't -- the same slot credential_table carries under the same name, for the same reason. An
-- audit record is usually about some particular thing, and with the hash of that thing in a margin
-- rather than inside the note, every record about it is an indexed lookup instead of a scan.
-- The DEFAULT is temporary scaffolding while deployed code inserts without this cell, and it fills
-- the existing rows correctly besides, since no meaningful hash is exactly what they hold. It leaves
-- with the contract migration after the deploy.
ALTER TABLE ledger_table ADD COLUMN hash_text TEXT NOT NULL DEFAULT '';

-- Partial the way credential13 is, and for the same reason: most rows will carry no hash, and their
-- blanks are not worth indexing -- so this indexes nothing at all until real hashes arrive. Tick
-- descending beside the hash, like ledger1 through ledger3, so "every record about this one thing,
-- newest first" is a single index read.
CREATE INDEX ledger4 ON ledger_table (hash_text, row_tick DESC) WHERE hide = 0 AND hash_text != '';
