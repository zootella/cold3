-- Expand phase of the hit melt: ledger7, the index that keeps one Hit. row per browser per hour once
-- hit_table's rows move in beside every other kind of record. A partial unique index rather than a
-- constraint, because a partial UNIQUE constraint does not exist in postgres, and because rows of
-- other actions share a hash on purpose -- every record about one address carries that address's
-- hash. Only the Hit. rows are held unique, and PostgREST reaches this index the one way it can: a
-- plain insert that lets it raise 23505, which recordHit's helper takes as the quiet answer.
CREATE UNIQUE INDEX ledger7 ON ledger_table (hash_text) WHERE action_text = 'Hit.';
