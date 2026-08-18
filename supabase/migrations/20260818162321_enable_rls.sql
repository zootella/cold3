-- Enable row-level security on all six tables, with zero policies: default-deny for supabase's
-- anon and authenticated roles, which cold3 never uses. The worker authenticates as service_role,
-- which carries BYPASSRLS, so the app, local development, and read-only scripts are untouched.
ALTER TABLE credential_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_table      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hit_table        ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_table    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_table   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_table      ENABLE ROW LEVEL SECURITY;

-- Second layer: strip the roles' historical full grants, leaving them present for PostgREST but
-- powerless. RLS above is what clears supabase's advisor; this also closes the table-level
-- TRUNCATE grant that row-level security cannot cover. This statement lives here and not in the
-- SQL() registry, because PGlite creates no anon or authenticated roles and would error running it.
REVOKE ALL PRIVILEGES ON TABLE credential_table, delay_table, hit_table, service_table, settings_table, trail_table FROM anon, authenticated;
