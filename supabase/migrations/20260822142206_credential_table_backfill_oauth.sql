-- Backfill phase of the credential_table k collapse, the oauth translation: five slots become the
-- named note. jsonb_strip_nulls over NULLIF turns blank slots into absent keys, so this one statement
-- handles the challenge rows (k1 alone becomes {provider}) and the validated rows (all five) without
-- branching. The strip runs over the scalar keys only, because jsonb_strip_nulls is recursive and the
-- proof legitimately holds nulls -- Discord's global_name, GitHub's profile name -- which are data to
-- keep verbatim; the proof concatenates on separately. The k8 text is makeText output, valid json, and
-- the survey ran this exact cast read-only across every non-blank value before this file was written.
UPDATE credential_table SET note_json =
	jsonb_strip_nulls(jsonb_build_object(
		'provider',   NULLIF(k1_text, ''),
		'identifier', NULLIF(k2_text, ''),
		'handle',     NULLIF(k3_text, ''),
		'name',       NULLIF(k4_text, '')
	))
	|| CASE WHEN k8_text != '' THEN jsonb_build_object('proof', k8_text::jsonb) ELSE '{}'::jsonb END
WHERE type_text = 'Oauth.' AND note_json = '{}'::jsonb;
