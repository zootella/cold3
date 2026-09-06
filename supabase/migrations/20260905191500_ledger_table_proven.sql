-- The proven rename, the data half. The oauth handler recorded the moment a user proved control of their
-- account as Validated., and the word is now Proven., the same word the code writes from this deploy on and
-- the same word credential_table's event column will hold once it says words instead of numbers. Five rows as
-- this was written, all from oauth smoke tests. No column changes, so this is one push, not an expansion and a
-- contraction. The code deploys first, so a sign-in between the deploy and this push is caught here too.
UPDATE ledger_table SET event_text = 'Proven.' WHERE event_text = 'Validated.';
