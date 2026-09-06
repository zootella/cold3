-- Backfill phase of credential_table's event column becoming words: rows born before the dual-write deploy
-- carry a number in event and a blank in event_text, and this writes the word for each number, hidden rows
-- included -- history translates too, because the contraction takes event from every row. The blank-cell
-- guard on event_text makes it idempotent and skips rows the dual-write already filled. The CASE has no ELSE
-- on purpose: a number outside 2, 3, and 4 would make it NULL, the NOT NULL column would refuse the row, and
-- the migration would fail loudly rather than write a blank. The read-only survey (September 6, 2026) found
-- 262 rows to translate, every one holding 2, 3, or 4, and none with event_text already filled.
UPDATE credential_table SET event_text = CASE event WHEN 2 THEN 'Mentioned.' WHEN 3 THEN 'Challenged.' WHEN 4 THEN 'Proven.' END WHERE event_text = '';
