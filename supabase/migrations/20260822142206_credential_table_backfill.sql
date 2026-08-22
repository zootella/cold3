-- Backfill phase of the credential_table k collapse, the simple translations: rows born before
-- the dual-write deploy carry their k values into the new cells, per type, hidden rows included --
-- history translates too, because the contraction drops the k columns for every row. Each statement's
-- blank-cell guard makes it idempotent and skips rows the dual-write already filled. The read-only
-- survey (August 21, 2026) proved every shape here: which slots each type uses, and that every
-- Browser. and Password. k1 is a well-formed 52-character hash.

-- Totp.: the enrollment secret becomes the note's one property
UPDATE credential_table SET note_json = jsonb_build_object('secret', k1_text)
WHERE type_text = 'Totp.' AND note_json = '{}'::jsonb AND k1_text != '';

-- Email. and Phone.: challenged rows name the provider that carried the code; mention and validated rows have no payload and match no guard
UPDATE credential_table SET note_json = jsonb_build_object('provider', k1_text)
WHERE type_text IN ('Email.', 'Phone.') AND note_json = '{}'::jsonb AND k1_text != '';

-- Browser.: browserHash moves to the hash column; browser rows carry no note
UPDATE credential_table SET hash_text = k1_text
WHERE type_text = 'Browser.' AND hash_text = '' AND k1_text != '';

-- Password.: the password hash moves to the hash column, and cycles becomes a real number in the note
UPDATE credential_table SET hash_text = k1_text, note_json = jsonb_build_object('cycles', k2_text::bigint)
WHERE type_text = 'Password.' AND hash_text = '' AND k1_text != '';

-- Discord.: the one pre-unification remnant row hides, the ledger way -- its account is properly
-- linked as a visible Oauth. row, so nothing here is worth translating, and the contraction then
-- drops its k1 along with everyone else's
UPDATE credential_table SET hide = 1 WHERE type_text = 'Discord.' AND hide = 0;
