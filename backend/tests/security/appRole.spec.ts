import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * What `para_app` may and may not do.
 *
 * The application used to connect as the `postgres` superuser. These tests are
 * the evidence that the replacement role can still run the application and can
 * no longer run the database — asserted against a real server, because
 * "NOSUPERUSER" is only a claim until Postgres refuses something.
 *
 * Everything happens in a throwaway database created and dropped by this file.
 * The application database is never opened.
 *
 * The setup executes backend/db/security/001-app-role.sql itself, rather than a
 * copy of its statements, so the script that ships is the script under test.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_DIR = path.resolve(dirname, '../../db/security')

/** Superuser connection, used only to build and tear down the probe database. */
const ADMIN_URI =
  process.env.SECURITY_TEST_ADMIN_URI || 'postgresql://postgres:postgres@127.0.0.1:5433/postgres'

const APP_PASSWORD = 'probe-only-not-a-real-secret'
const RUN_ID = `${process.pid}_${Date.now().toString(36)}`
const PROBE_DB = `para_sec_probe_${RUN_ID}`
/**
 * Uniquely named because PostgreSQL roles are cluster-wide, not per-database:
 * a hard-coded `para_app` here would survive DROP DATABASE and linger on the
 * server with this file's throwaway password — or be dropped from under a real
 * deployment during cleanup.
 */
const APP_ROLE = `para_app_probe_${RUN_ID}`
/**
 * Names for the objects the "must be refused" tests try to create. They are
 * unique and cleaned up unconditionally because the moment those statements
 * stop being refused is exactly the moment the artifacts get left behind — a
 * stray SUPERUSER role on the cluster is a worse outcome than a failed test.
 */
const ESCALATED_ROLE = `para_escalation_probe_${RUN_ID}`
const ESCALATED_DB = `para_escalation_db_${RUN_ID}`

/**
 * Runs a psql script through the plain driver.
 *
 * psql's own syntax has to be handled here: `\set` meta-commands are dropped,
 * and `:'var'` / `:"var"` are substituted the way psql would (as a quoted
 * literal and a quoted identifier). Only these two forms are used by the
 * scripts, and an unsubstituted `:name` left behind would be a syntax error
 * rather than a silent mis-run.
 */
function runPsqlScript(client: Client, file: string, vars: Record<string, string>) {
  const raw = readFileSync(path.join(SQL_DIR, file), 'utf8')
  const sql = raw
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('\\'))
    .join('\n')
    .replace(/:'(\w+)'/g, (_m, name: string) => `'${(vars[name] ?? '').replace(/'/g, "''")}'`)
    .replace(/:"(\w+)"/g, (_m, name: string) => `"${(vars[name] ?? '').replace(/"/g, '""')}"`)

  return client.query(sql)
}

const connect = async (uri: string) => {
  const c = new Client({ connectionString: uri })
  await c.connect()
  return c
}

/** The admin URI, repointed at the probe database and optionally another role. */
function probeUri(user?: string, password?: string): string {
  const url = new URL(ADMIN_URI)
  if (user) {
    url.username = user
    url.password = password ?? ''
  }
  url.pathname = `/${PROBE_DB}`
  return url.toString()
}

/**
 * Probed at module load so `describe.skipIf` can see it: without a reachable
 * server these tests must report as SKIPPED, never as passed. Guarding inside
 * each test with an early return would turn "no database" into a green run,
 * which is the one outcome that must not happen for a security suite.
 */
const reachable = await (async () => {
  try {
    const probe = new Client({ connectionString: ADMIN_URI, connectionTimeoutMillis: 3000 })
    await probe.connect()
    await probe.end()
    return true
  } catch {
    return false
  }
})()

let admin: Client | null = null
let app: Client | null = null

/** Asserts the statement is refused, and returns the error for inspection. */
async function refuses(client: Client, sql: string): Promise<Error> {
  let caught: Error | null = null
  try {
    await client.query(sql)
  } catch (err) {
    caught = err as Error
  }
  if (!caught) throw new Error(`expected PostgreSQL to refuse: ${sql}`)
  return caught
}

beforeAll(async () => {
  if (!reachable) return

  const bootstrap = await connect(ADMIN_URI)
  await bootstrap.query(`CREATE DATABASE ${PROBE_DB}`)
  await bootstrap.end()

  admin = await connect(probeUri())

  // A schema shaped like the real one: a serial primary key (so sequence use
  // is exercised) and an enum type (so `ALTER TYPE ... ADD VALUE`, which
  // Payload migrations emit, is exercised).
  await admin.query(`
    CREATE TYPE public.probe_status AS ENUM ('pending', 'paid');
    CREATE TABLE public.probe_orders (
      id serial PRIMARY KEY,
      customer_email varchar NOT NULL,
      total numeric NOT NULL DEFAULT 0,
      status public.probe_status NOT NULL DEFAULT 'pending'
    );
    INSERT INTO public.probe_orders (customer_email, total) VALUES ('a@example.com', 100), ('b@example.com', 200);
    -- Standalone: not owned by any table column, so ALTER TABLE ... OWNER TO
    -- will not carry it across. Without this the script's sequence loop is
    -- unobservable and could be deleted with every test still green.
    CREATE SEQUENCE public.probe_standalone_seq;
  `)

  await runPsqlScript(admin, '001-app-role.sql', { app_password: APP_PASSWORD, db_name: PROBE_DB, role_name: APP_ROLE })

  app = await connect(probeUri(APP_ROLE, APP_PASSWORD))
}, 60_000)

afterAll(async () => {
  if (!reachable) return
  await app?.end().catch(() => {})

  // The reversal script is exercised here so every run also tests it — but its
  // failure must not strand objects on the cluster, so the forced cleanup
  // below runs regardless and the suite reports on the end state, not on
  // whether this call happened to work.
  let reversalError: unknown = null
  if (admin) {
    try {
      await runPsqlScript(admin, '001-app-role.down.sql', { db_name: PROBE_DB, role_name: APP_ROLE })
    } catch (err) {
      reversalError = err
    }
  }
  await admin?.end().catch(() => {})

  const bootstrap = await connect(ADMIN_URI)
  const drop = async (sql: string, params: unknown[] = []) => {
    try {
      await bootstrap.query(sql, params)
    } catch {
      // best effort — the audit below is what decides pass or fail
    }
  }

  // Databases before roles: a role that owns one cannot be dropped.
  for (const db of [PROBE_DB, ESCALATED_DB]) {
    await drop(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [db])
    await drop(`DROP DATABASE IF EXISTS ${db}`)
  }
  for (const role of [APP_ROLE, ESCALATED_ROLE]) {
    await drop(`DROP ROLE IF EXISTS ${role}`)
  }

  const { rows } = await bootstrap.query(
    `SELECT rolname AS leftover FROM pg_roles WHERE rolname = ANY($1)
     UNION ALL
     SELECT datname FROM pg_database WHERE datname = ANY($2)`,
    [
      [APP_ROLE, ESCALATED_ROLE],
      [PROBE_DB, ESCALATED_DB],
    ],
  )
  await bootstrap.end()

  if (rows.length) {
    throw new Error(`teardown left objects on the cluster: ${rows.map((r) => r.leftover).join(', ')}`)
  }
  if (reversalError) throw reversalError
}, 60_000)

describe.skipIf(process.env.SECURITY_TEST_OPTIONAL === '1')('the suite itself', () => {
  it('has a PostgreSQL server to test against', () => {
    // A fully skipped suite exits 0 and is indistinguishable from a passing
    // one — for a security suite that is the worst possible failure mode. This
    // is the tripwire. CI without a Postgres service sets
    // SECURITY_TEST_OPTIONAL=1 to opt out deliberately.
    expect(
      reachable,
      `no PostgreSQL reachable at ${ADMIN_URI}; set SECURITY_TEST_OPTIONAL=1 to allow skipping`,
    ).toBe(true)
  })
})

describe.skipIf(!reachable)('para_app — role attributes', () => {
  it('is not a superuser and cannot bypass row-level security', async () => {
    const { rows } = await app!.query(
      `SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication
         FROM pg_roles WHERE rolname = $1`,
      [APP_ROLE],
    )
    expect(rows[0]).toEqual({
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolreplication: false,
      rolsuper: false,
    })
  })

  it('reports itself as the application role, not postgres', async () => {
    const { rows } = await app!.query('SELECT current_user')
    expect(rows[0].current_user).toBe(APP_ROLE)
  })
})

describe.skipIf(!reachable)(
  'para_app — what the application still needs',
  () => {
    it('reads, writes, updates and deletes business rows', async () => {

      const inserted = await app!.query(
        `INSERT INTO probe_orders (customer_email, total) VALUES ('c@example.com', 50) RETURNING id`,
      )
      // A serial id means the sequence was usable, which a GRANT-only setup
      // silently gets wrong.
      expect(inserted.rows[0].id).toBeGreaterThan(0)

      const read = await app!.query(`SELECT count(*)::int AS n FROM probe_orders`)
      expect(read.rows[0].n).toBe(3)

      await app!.query(`UPDATE probe_orders SET total = 75 WHERE id = $1`, [inserted.rows[0].id])
      await app!.query(`DELETE FROM probe_orders WHERE id = $1`, [inserted.rows[0].id])

      const after = await app!.query(`SELECT count(*)::int AS n FROM probe_orders`)
      expect(after.rows[0].n).toBe(2)
    })

    it('runs the DDL a Payload boot-time migration performs', async () => {
      // prodMigrations means the app applies migrations itself on boot. If any
      // of these were refused the backend would fail to start after a deploy.
      await app!.query(`CREATE TABLE probe_migration_target (id serial PRIMARY KEY)`)
      await app!.query(`ALTER TABLE probe_migration_target ADD COLUMN label varchar`)
      await app!.query(`CREATE INDEX probe_migration_idx ON probe_migration_target (label)`)
      await app!.query(`ALTER TABLE probe_orders ADD COLUMN probe_added varchar`)
      await app!.query(`ALTER TABLE probe_orders DROP COLUMN probe_added`)
      await app!.query(`DROP TABLE probe_migration_target`)

      // Enum extension: emitted whenever a Payload select field gains an option.
      await app!.query(`ALTER TYPE public.probe_status ADD VALUE IF NOT EXISTS 'shipped'`)
    })
  },
)

describe.skipIf(!reachable)(
  'para_app — what it can no longer do',
  () => {
    it('cannot execute shell commands through COPY FROM PROGRAM', async () => {
      // The single most valuable privilege removed: on a superuser connection
      // this is arbitrary code execution as the postgres OS user.
      const err = await refuses(app!, `COPY probe_orders FROM PROGRAM 'echo pwned'`)
      expect(err.message).toMatch(/superuser|permission denied|pg_execute_server_program/i)
    })

    it('cannot read files from the database server', async () => {
      const err = await refuses(app!, `SELECT pg_read_file('/etc/passwd')`)
      expect(err.message).toMatch(/permission denied|superuser|pg_read_server_files/i)
    })

    it('cannot create roles or grant itself superuser', async () => {
      await refuses(app!, `CREATE ROLE ${ESCALATED_ROLE} LOGIN SUPERUSER`)
      await refuses(app!, `ALTER ROLE ${APP_ROLE} SUPERUSER`)
      await refuses(app!, `ALTER ROLE ${APP_ROLE} BYPASSRLS`)
    })

    it('cannot change server configuration', async () => {
      const err = await refuses(app!, `ALTER SYSTEM SET log_statement = 'none'`)
      expect(err.message).toMatch(/superuser|permission denied|ALTER SYSTEM/i)
    })

    it('cannot create a database', async () => {
      await refuses(app!, `CREATE DATABASE ${ESCALATED_DB}`)
    })
  },
)

describe.skipIf(!reachable)(
  'row-level security is now actually evaluated',
  () => {
    it('is enforced on a table the application does not own', async () => {
      // The point of the whole change. Under the previous superuser connection
      // this returned every row regardless of policy.
      await admin!.query(`
        CREATE TABLE public.probe_private (id serial PRIMARY KEY, owner_email varchar NOT NULL);
        INSERT INTO public.probe_private (owner_email) VALUES ('a@example.com'), ('b@example.com');
        ALTER TABLE public.probe_private ENABLE ROW LEVEL SECURITY;
        CREATE POLICY probe_deny ON public.probe_private USING (owner_email = 'nobody-should-match');
        GRANT SELECT ON public.probe_private TO ${APP_ROLE};
      `)

      const { rows } = await app!.query(`SELECT count(*)::int AS n FROM public.probe_private`)
      expect(rows[0].n).toBe(0)

      await admin!.query(`DROP TABLE public.probe_private`)
    })

    it('needs FORCE on a table the application owns, because an owner is exempt', async () => {
      // para_app owns the application's tables, and a table owner is exempt
      // from its own policies unless the table is FORCEd. Getting this wrong is
      // how RLS ends up looking enabled while doing nothing — so both halves
      // are pinned here.
      await app!.query(`
        CREATE TABLE probe_owned (id serial PRIMARY KEY, owner_email varchar NOT NULL);
        INSERT INTO probe_owned (owner_email) VALUES ('a@example.com'), ('b@example.com');
        ALTER TABLE probe_owned ENABLE ROW LEVEL SECURITY;
        CREATE POLICY probe_deny ON probe_owned USING (owner_email = 'nobody-should-match');
      `)

      const exempt = await app!.query(`SELECT count(*)::int AS n FROM probe_owned`)
      expect(exempt.rows[0].n).toBe(2) // ENABLE alone does not constrain the owner

      await app!.query(`ALTER TABLE probe_owned FORCE ROW LEVEL SECURITY`)

      const forced = await app!.query(`SELECT count(*)::int AS n FROM probe_owned`)
      expect(forced.rows[0].n).toBe(0) // FORCE does

      await app!.query(`DROP TABLE probe_owned`)
    })
  },
)

describe.skipIf(!reachable)(
  'the bootstrap script itself',
  () => {
    it('is idempotent — a second run changes nothing and raises nothing', async () => {
      await runPsqlScript(admin!, '001-app-role.sql', { app_password: APP_PASSWORD, db_name: PROBE_DB, role_name: APP_ROLE })

      const { rows } = await admin!.query(
        `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1`,
        [APP_ROLE],
      )
      expect(rows[0]).toEqual({ rolbypassrls: false, rolsuper: false })

      // And the application connection still works afterwards.
      const still = await app!.query(`SELECT count(*)::int AS n FROM probe_orders`)
      expect(still.rows[0].n).toBe(2)
    })

    it('transfers a standalone sequence, which table ownership does not carry', async () => {
      const owner = await admin!.query(
        `SELECT sequenceowner FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'probe_standalone_seq'`,
      )
      expect(owner.rows[0].sequenceowner).toBe(APP_ROLE)

      // And the application can actually draw from it.
      const next = await app!.query(`SELECT nextval('public.probe_standalone_seq')::int AS v`)
      expect(next.rows[0].v).toBe(1)
    })

    it('leaves no table in the public schema owned by anyone else', async () => {
      const { rows } = await admin!.query(
        `SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tableowner <> $1`,
        [APP_ROLE],
      )
      expect(rows[0].n).toBe(0)
    })
  },
)
