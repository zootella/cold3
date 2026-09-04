-- Expand phase of client_json: what we're told about the client on every ledger row, beyond the ip
-- and origin that already have columns. Four facts describe a connection, all read by the door on
-- every request: the ip address and the origin, each a string with its own column, and the
-- geography Cloudflare derived from the ip and the browser's account of itself, two objects that
-- ride together here as {geography, browser}. Until now a Hit. row carried both inside json and every
-- other row carried neither; after this, every row fills the same three cells the same way, and json
-- is free for what a particular row has to say. The DEFAULT is scaffolding for the window between
-- this push and the deploy that fills the cell, and it fills the existing rows correctly besides,
-- since {} is exactly what a row written before this knows. No index until a query wants one.
ALTER TABLE ledger_table ADD COLUMN client_json JSONB NOT NULL DEFAULT '{}';
