-- Create ledger_table: durable audit in our own database, the queryable alternative to logAudit.
-- A new table is one migration creating it whole -- no existing rows or callers means no expansion
-- and contraction, and no temporary defaults.

-- First, close the door this table would otherwise walk through: the schema's default privileges
-- auto-grant anon and authenticated on tables created by postgres. Revoke that for all future
-- tables, dashboard-created ones included; service_role keeps its default grant.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

CREATE TABLE ledger_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	ip_text        TEXT      NOT NULL,  -- Trusted: ip address, according to cloudflare, or blank
	browser_hash   CHAR(52)  NOT NULL,  -- Reported: the browser that was here for this
	user_tag_text  TEXT      NOT NULL,  -- Derived: the user at that browser, or blank if none identified

	wrapper_hash   CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper
	action_text    TEXT      NOT NULL,  -- title of what happened
	note_json      JSONB     NOT NULL   -- everything else about what happened; {} when the margins say it all
);

CREATE INDEX ledger1 ON ledger_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger2 ON ledger_table (user_tag_text, row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger3 ON ledger_table (action_text,   row_tick DESC) WHERE hide = 0;

ALTER TABLE ledger_table ENABLE ROW LEVEL SECURITY;

-- Grants, explicit regardless of which default-privilege chain applied at creation: the worker's
-- service_role gets full reach, and the unused roles get none. These statements live here and not
-- in the SQL() registry, because PGlite creates none of these roles and would error running them.
REVOKE ALL PRIVILEGES ON TABLE ledger_table FROM anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE ledger_table TO service_role;
