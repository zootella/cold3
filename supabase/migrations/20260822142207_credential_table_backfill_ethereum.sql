-- Backfill phase of the credential_table k collapse, the f repair: Ethereum. rows born before the
-- dual-write deploy hold the checksummed address alone in f0 with f1 and f2 blank. The triad fills
-- by the validate rules -- f0 the lowercased matching form, f1 and f2 the checksummed face -- and
-- every SET expression reads the old row, so f1 and f2 receive the checksummed original in the same
-- statement that lowercases f0. The blank-f1 guard makes it idempotent and skips rows the deployed
-- code already wrote complete. After this lands, the wallet lookups' checksummed-spelling fallback
-- finds nothing, and the read-switch deploy narrows them to lowercase alone.
UPDATE credential_table SET f0_text = lower(f0_text), f1_text = f0_text, f2_text = f0_text
WHERE type_text = 'Ethereum.' AND f1_text = '';
