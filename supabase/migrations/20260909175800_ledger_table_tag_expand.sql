-- Expand phase of tag_text: the tag of the operation a ledger row belongs to, a sibling to hash_text.
-- One call that changed something from the outside in--a send, a proof, a sign-in--writes several
-- rows, and until now nothing tied them together: the three rows an otp send leaves could only be
-- found by reading around them in time. This column carries one tag on every row that call wrote, so
-- the whole operation gathers under one filter, in order. hash_text holds the row's one meaningful
-- hash and this holds its one meaningful tag; both stay blank when the row has none. The DEFAULT is
-- scaffolding for the window between this push and the deploy that fills the cell, and it fills the
-- existing rows correctly besides, since a row written before the tag existed belongs to no operation
-- anyone can name. ledger8 rides along, indexing blanks cheaply until the tags arrive, shaped like
-- ledger4 because it answers the same kind of question.
ALTER TABLE ledger_table ADD COLUMN tag_text TEXT NOT NULL DEFAULT '';

CREATE INDEX ledger8 ON ledger_table (tag_text, row_tick DESC) WHERE hide = 0 AND tag_text != '';
