-- Contract phase of removing the hide column from the tables that never used it. The deploy has
-- landed: the query helpers no longer filter hide on a read or fill it on an insert, so nothing
-- deployed mentions the column on these four tables, and dropping it can't break a request whichever
-- side of the push it lands on. The scaffolding default goes with the column, and so does every
-- index that named it, trail1 and trail2, ledger1 through ledger6, ledger8, and ledger9, delay1 and
-- delay2, and settings1, which Postgres drops as dependents; their twins from the expansion push
-- already serve every read. ledger7 never named hide and stays. credential_table keeps its hide
-- column: it is the one table that still hides rows, and it loses the column in its own chapter,
-- once its last credential type has stopped hiding.
ALTER TABLE trail_table    DROP COLUMN hide;
ALTER TABLE ledger_table   DROP COLUMN hide;
ALTER TABLE delay_table    DROP COLUMN hide;
ALTER TABLE settings_table DROP COLUMN hide;
