-- Drop service_table, which was specified as the record of every request to and response from every
-- third-party api, built, and then never written to -- no code has ever inserted a row, and it holds
-- none. Its job belongs to ledger_table now, which keeps the same records in a smaller shape: margins
-- for filtering and one json note carrying whatever detail the moment has, rather than fifteen fixed
-- text columns guessing in advance at what a provider call looks like. The message path already
-- writes there, and the remaining call sites arrive with the sprints that own them.
-- Its three indexes and its grants fall with the table, and nothing in the database references it:
-- no foreign key, no view, no policy.
DROP TABLE service_table;
