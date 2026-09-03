-- Backfill phase of the credential_table rename of note_json to json: rows born before the dual-write
-- deploy carry their note in note_json and {} in json, and this copies it across, hidden rows
-- included -- history translates too, because the contraction takes note_json from every row. The
-- blank-cell guard on json makes it idempotent and skips rows the dual-write already filled, and a
-- row whose note is blank matches no guard, since {} is what both its columns already hold. The
-- read-only survey (September 3, 2026) found 95 rows to copy across Email., Phone., Password.,
-- Totp., and Oauth., visible and hidden, and none with json already filled.
UPDATE credential_table SET json = note_json WHERE json = '{}'::jsonb AND note_json != '{}'::jsonb;
