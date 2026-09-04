-- Contract phase of client_json: the Hit. rows written before the deploy carry their geography and
-- browser inside json, the way hit_table's melt and recordHit until now left them, and this moves
-- both into client_json and empties json, so every row holds the same three cells about the client
-- the same way and json says only what a particular row has to say. The guard on client_json keeps
-- this off the rows the deploy already wrote, and the guard on json makes a second run change
-- nothing. Hidden rows come along too. Then the scaffolding default retires, returning the table to
-- house style: every column NOT NULL, no defaults, every cell provided explicitly.
UPDATE ledger_table SET
	client_json = jsonb_build_object('geography', json->'geography', 'browser', json->'browser'),
	json = '{}'::jsonb
WHERE action_text = 'Hit.' AND client_json = '{}'::jsonb AND json ? 'geography';

ALTER TABLE ledger_table ALTER COLUMN client_json DROP DEFAULT;
