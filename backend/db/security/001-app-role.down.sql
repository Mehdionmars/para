-- Reverses 001-app-role.sql.
--
-- Hands the `public` schema back to `postgres` and removes the application
-- role. Use it to roll back a bad deploy, or to take a database back to the
-- pre-change state for comparison.
--
-- ORDER MATTERS: point DATABASE_URI back at the superuser and restart the
-- backend BEFORE running this. Dropping a role that an open pool is still
-- authenticated as will fail on the dependency check, and if it did succeed
-- the application would lose its connection mid-request.
--
-- USAGE (as a superuser):
--   psql -U postgres -d para_dhiver \
--        -v role_name=para_app -v db_name=para_dhiver \
--        -f backend/db/security/001-app-role.down.sql
--
-- Roles are cluster-wide, so this drops one by the name it is given. Pass the
-- same `role_name` that was used on the way up and nothing else is touched.
--
-- Idempotent: safe on a database where the role was never created. It creates
-- no tables and touches no business data.

\set ON_ERROR_STOP on

SELECT set_config('para.role_name', :'role_name', false);

DO $$
DECLARE
  role_name text := current_setting('para.role_name');
  obj record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
    RAISE NOTICE '% does not exist — nothing to reverse', role_name;
    RETURN;
  END IF;

  FOR obj IN SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' AND tableowner = role_name
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', obj.name);
  END LOOP;

  FOR obj IN SELECT sequencename AS name FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner = role_name
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO postgres', obj.name);
  END LOOP;

  FOR obj IN
    SELECT c.relname AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'v'
       AND pg_get_userbyid(c.relowner) = role_name
  LOOP
    EXECUTE format('ALTER VIEW public.%I OWNER TO postgres', obj.name);
  END LOOP;

  FOR obj IN
    SELECT t.typname AS name
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typtype = 'e'
       AND pg_get_userbyid(t.typowner) = role_name
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO postgres', obj.name);
  END LOOP;
END
$$;

-- Must mirror step 4 of the up script exactly, or DROP ROLE fails on a
-- lingering default-privileges dependency.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM :"role_name";
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM :"role_name";

REVOKE ALL ON SCHEMA public FROM :"role_name";
REVOKE ALL ON DATABASE :"db_name" FROM :"role_name";

DROP OWNED BY :"role_name";
DROP ROLE IF EXISTS :"role_name";

SELECT count(*) AS role_rows_remaining FROM pg_roles WHERE rolname = :'role_name';
