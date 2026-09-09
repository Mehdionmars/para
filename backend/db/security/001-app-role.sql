-- Least-privilege application role.
--
-- WHY THIS EXISTS
-- Payload connects with the connection string in DATABASE_URI. That was the
-- bootstrap `postgres` superuser, which is far more authority than the
-- application needs: a superuser connection can run `COPY ... FROM PROGRAM`
-- (arbitrary shell commands as the postgres OS user), read and write any file
-- the server process can reach, create roles, `ALTER SYSTEM`, disable logging,
-- drop the database, and bypass every row-level security policy. An injection
-- or RCE anywhere in the Node tier inherits all of that.
--
-- This script creates the role and moves the schema to it. The role keeps
-- exactly what the application actually uses and nothing else.
--
-- WHAT IT DELIBERATELY KEEPS
-- DDL on `public`. payload.config.ts sets `prodMigrations`, so the backend
-- applies pending migrations itself on boot — it genuinely needs CREATE/ALTER
-- on its own tables and enum types. Splitting migrations onto a second role
-- would mean removing `prodMigrations` and adding a deploy step, which is a
-- separate decision; it is NOT required for the privilege reduction below.
-- Ownership (rather than plain GRANTs) is what lets migrations ALTER and DROP
-- objects that already exist.
--
-- WHAT IT REMOVES
-- SUPERUSER, BYPASSRLS, CREATEROLE, CREATEDB, REPLICATION. tests/security/
-- asserts each of these is actually gone rather than assuming it.
--
-- RLS FOUNDATION
-- The role is NOBYPASSRLS, so row-level security policies would from now on
-- actually be evaluated against it — which they are not today. Note that it
-- OWNS these tables, and a table owner is exempt from its own policies unless
-- the table is also set to FORCE ROW LEVEL SECURITY. Any future RLS work here
-- must use ENABLE **and** FORCE, or the policies will silently do nothing.
-- tests/security/appRole.spec.ts pins both halves of that.
--
-- USAGE (as a superuser, e.g. the postgres role):
--   psql -U postgres -d para_dhiver \
--        -v role_name=para_app \
--        -v app_password="$APP_DB_PASSWORD" \
--        -v db_name=para_dhiver \
--        -f backend/db/security/001-app-role.sql
--
-- `role_name` is a parameter rather than a hard-coded literal so the security
-- tests can bootstrap a uniquely named throwaway role. PostgreSQL roles are
-- cluster-wide, not per-database, so a test that hard-coded `para_app` would
-- leave one behind after dropping its scratch database — or, worse, drop a
-- real one during cleanup.
--
-- Idempotent: safe to run repeatedly, including on a database that has already
-- been migrated. It creates no tables and touches no business data.

\set ON_ERROR_STOP on

-- The role name has to be readable from inside the DO blocks below, and psql
-- does not substitute `:variables` inside dollar-quoted bodies. A session GUC
-- carries it across that boundary.
SELECT set_config('para.role_name', :'role_name', false);

-- 1. The role itself. CREATE is guarded so re-runs do not error; the ALTER
--    then reasserts the attribute set, so a role that was created by hand with
--    the wrong flags is corrected rather than left as-is.
DO $$
DECLARE
  role_name text := current_setting('para.role_name');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
    EXECUTE format('CREATE ROLE %I LOGIN', role_name);
  END IF;
END
$$;

ALTER ROLE :"role_name" WITH
  LOGIN
  NOSUPERUSER
  NOBYPASSRLS
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  PASSWORD :'app_password';

-- 2. Reach the database and the schema.
GRANT CONNECT ON DATABASE :"db_name" TO :"role_name";
GRANT USAGE, CREATE ON SCHEMA public TO :"role_name";

-- 3. Hand over the existing schema.
--
--    Ownership, not GRANTs: `ALTER TABLE` and `DROP TABLE` require ownership,
--    and Payload's boot-time migrations do both. Enum types are included
--    because Payload migrations run `ALTER TYPE ... ADD VALUE` whenever a
--    select field gains an option.
--
--    Scoped to the `public` schema by explicit loops rather than
--    `REASSIGN OWNED BY postgres`, which would also sweep up objects in other
--    schemas and the database itself.
DO $$
DECLARE
  role_name text := current_setting('para.role_name');
  obj record;
BEGIN
  FOR obj IN SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', obj.name, role_name);
  END LOOP;

  FOR obj IN SELECT sequencename AS name FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO %I', obj.name, role_name);
  END LOOP;

  FOR obj IN SELECT table_name AS name FROM information_schema.views WHERE table_schema = 'public'
  LOOP
    EXECUTE format('ALTER VIEW public.%I OWNER TO %I', obj.name, role_name);
  END LOOP;

  FOR obj IN
    SELECT t.typname AS name
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typtype = 'e'
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO %I', obj.name, role_name);
  END LOOP;
END
$$;

-- 4. Anything a superuser creates in `public` later (a hand-run fix, a restored
--    dump) stays usable by the application without a second migration.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"role_name";
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"role_name";

-- 5. Report, so a human running this sees what they got rather than trusting
--    that "no error" means "correct".
SELECT
  rolname       AS role,
  rolsuper      AS superuser,
  rolbypassrls  AS bypasses_rls,
  rolcreaterole AS can_create_roles,
  rolcreatedb   AS can_create_databases
FROM pg_roles
WHERE rolname = :'role_name';

SELECT count(*) FILTER (WHERE tableowner = :'role_name')  AS tables_owned_by_app,
       count(*) FILTER (WHERE tableowner <> :'role_name') AS tables_still_elsewhere
FROM pg_tables
WHERE schemaname = 'public';
