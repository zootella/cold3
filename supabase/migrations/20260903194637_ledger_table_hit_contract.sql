-- Contract phase of the hit melt: hit_table's rows move into ledger_table as Hit. rows, and the table
-- leaves. The read-only survey (September 3, 2026) found 2,871 rows, every hash distinct under hit1,
-- no row_tag or hash already in the ledger, none hidden, and json bags holding the keys recordHit
-- still writes: geography's country, city, region, and postal, and browser's agent, renderer, and
-- vendor. Each row keeps its tag and its tick, so the ledger's order by tick interleaves the old
-- visits with everything else exactly when they happened. A hit names no event and no provider, its
-- two bags ride inside json under the names recordHit uses, and its dedup hash moves to hash_text,
-- where ledger7 holds it unique among Hit. rows. The row_tag guard makes the copy idempotent.
INSERT INTO ledger_table (row_tag, row_tick, hide, wrapper_hash, ip_text, origin_text, browser_hash, user_tag_text, action_text, event_text, provider_text, hash_text, json)
SELECT row_tag, row_tick, hide, wrapper_hash, ip_text, origin_text, browser_hash, user_tag_text, 'Hit.', '', '', hash, jsonb_build_object('geography', geography_json, 'browser', browser_json)
FROM hit_table h
WHERE NOT EXISTS (SELECT 1 FROM ledger_table l WHERE l.row_tag = h.row_tag);

-- hit1, hit2, and hit3 fall with the table.
DROP TABLE hit_table;
