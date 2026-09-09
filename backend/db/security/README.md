# Database roles

## What this is

`001-app-role.sql` replaces the superuser connection the application used with a
least-privilege role. Nothing here is applied automatically — it is a bootstrap
step run by an operator, because the role has to exist before the application
can authenticate as it, and a Payload migration runs *on* that connection.

## Why

`docker-compose.yml` pointed `DATABASE_URI` at `postgres`, the bootstrap
superuser. Anything that can run SQL on that connection can also:

- run shell commands on the database host (`COPY … FROM PROGRAM`)
- read and write any file the server process can reach
- create roles and grant itself anything
- `ALTER SYSTEM`, including turning off logging
- drop the database
- bypass every row-level security policy

None of that is needed to serve a storefront. An injection or RCE anywhere in
the Node tier inherits all of it.

## Rollout order

The order matters — flipping `DATABASE_URI` before the role exists takes the
backend down.

1. **Pick a password** and put it somewhere the operator can read:

   ```bash
   export APP_DB_PASSWORD="$(openssl rand -base64 32)"
   ```

2. **Create the role and hand over the schema** (as a superuser). Idempotent —
   safe to re-run:

   ```bash
   psql -U postgres -d para_dhiver \
     -v role_name=para_app \
     -v app_password="$APP_DB_PASSWORD" \
     -v db_name=para_dhiver \
     -f backend/db/security/001-app-role.sql
   ```

   With the bundled compose stack, from the host:

   ```bash
   docker exec -i para-dhiver-postgres-1 psql -U postgres -d para_dhiver \
     -v role_name=para_app -v app_password="$APP_DB_PASSWORD" -v db_name=para_dhiver \
     < backend/db/security/001-app-role.sql
   ```

   The script prints the resulting role attributes and an ownership count. Read
   them: `superuser` and `bypasses_rls` must both be `f`, and
   `tables_still_elsewhere` must be `0`.

3. **Point the application at it.** `docker-compose.yml` now reads
   `DATABASE_URI` from the environment and falls back to the old superuser
   string, so this is a config change rather than an edit:

   ```bash
   # .env next to docker-compose.yml
   DATABASE_URI=postgresql://para_app:<password>@postgres:5432/para_dhiver
   ```

4. **Restart the backend** and confirm it boots, applies any pending migration,
   and can complete a checkout.

## Rolling back

```bash
# 1. put DATABASE_URI back to the postgres:// superuser string, restart backend
# 2. then:
psql -U postgres -d para_dhiver \
  -v role_name=para_app -v db_name=para_dhiver \
  -f backend/db/security/001-app-role.down.sql
```

Reverse order matters as much here: `DROP ROLE` fails while a pool is still
authenticated as it.

## What the role keeps, and why

It keeps `CREATE`/`ALTER`/`DROP` on the `public` schema, and it **owns** the
tables. That is not an oversight: `payload.config.ts` sets `prodMigrations`, so
the backend applies pending migrations itself on boot, and `ALTER TABLE` requires
ownership. Moving migrations to a second, DDL-only role means removing
`prodMigrations` and adding a deploy step — a separate decision, and not needed
for the privilege reduction above.

## Row-level security

The role is `NOBYPASSRLS`, so RLS policies would now actually be evaluated
against it. They are not evaluated today, and were not before this change
either — a superuser bypasses them unconditionally, which is why no RLS shipped
alongside this.

One trap if RLS is added later: the application **owns** these tables, and a
table owner is exempt from its own policies unless the table is also set to
`FORCE ROW LEVEL SECURITY`. `ENABLE` alone will look correct in `pg_policies`
and do nothing. `tests/security/appRole.spec.ts` pins both halves of that
behaviour so the distinction cannot be forgotten.

## Tests

```bash
npm run test:security --prefix backend
```

Creates a throwaway database, runs the real scripts against it, asserts what the
role can and cannot do, then runs the reversal script as teardown and fails if
anything is left on the cluster. It never opens the application database.

Set `SECURITY_TEST_ADMIN_URI` to point at another server. In CI without a
Postgres service, set `SECURITY_TEST_OPTIONAL=1` to allow the suite to skip —
without it, an unreachable server is a failure, because a silently skipped
security suite is indistinguishable from a passing one.
