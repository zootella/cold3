-- Expand phase of door_tag: the request that wrote a ledger row. Every door mints a tag as it opens
-- and pins it on the door, so any code below reaches it through getDoor() without a parameter
-- threaded through twenty signatures, and _ledgerRow puts it on every row it assembles. That is what
-- makes this column mandatory rather than optional: the tag is always in hand, so the database can
-- require it. Alice signing in on her chromebook and Bob signing in on the living room profile write
-- rows that already differ by browser_hash and user_tag_text; door_tag says something neither of
-- those can, which is that these particular rows came from one click. It also crosses the hop into
-- the lambda, since the worker seals its tag into the Network23. envelope, so the rows both providers
-- write about one request gather together.
--
-- The DEFAULT is twenty-one zeros, tag-shaped so every guard accepts it and unmistakable on sight, and it does
-- two jobs at once. ADD COLUMN fills every existing row with it, so rows written before doors carried
-- tags say so plainly rather than needing a backfill of their own. And it covers the window between
-- this push and the deploy, when the worker still running inserts rows that don't mention the cell.
-- The contraction drops it, and from then on an insert without a door tag fails, which is the
-- database holding the rule rather than the code alone.
ALTER TABLE ledger_table ADD COLUMN door_tag CHAR(21) NOT NULL DEFAULT '000000000000000000000';

CREATE INDEX ledger9 ON ledger_table (door_tag, row_tick DESC) WHERE hide = 0;
