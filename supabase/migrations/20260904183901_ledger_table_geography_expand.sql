-- Expand phase of geography's column: what Cloudflare knew about where a request came from, on every
-- ledger row rather than inside the Hit. rows' json. A real column because it's a fact about the
-- request like ip_text and origin_text beside it, present on every row a worker writes, and {} when
-- there is no Cloudflare, like local development. The DEFAULT is scaffolding for the window between
-- this push and the deploy that fills the cell, and it fills the existing rows correctly besides,
-- since {} is exactly what a row written before this knows. No index until a query wants one.
ALTER TABLE ledger_table ADD COLUMN geography_json JSONB NOT NULL DEFAULT '{}';
