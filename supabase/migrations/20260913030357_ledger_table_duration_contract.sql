-- Contract phase of duration. The column arrived with a scaffolding DEFAULT of -1 so that inserts
-- stayed whole through the window between its push and the deploy that started filling the cell. That
-- deploy has landed, _ledgerRow is the only thing that inserts here, and it sends the cell on every row,
-- -1 on every row that isn't the close of a provider pair. So the scaffolding has no more work to do,
-- and dropping it returns the table to house style, every column NOT NULL with every cell provided
-- explicitly. The -1 already on the rows from before stays, meaning exactly what it meant when it
-- arrived: those rows timed nothing.
ALTER TABLE ledger_table ALTER COLUMN duration DROP DEFAULT;
