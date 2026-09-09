import { Client } from 'pg'

/**
 * A throwaway PostgreSQL database, for tests that need the real server.
 *
 * Concurrency and constraint behaviour cannot be faked: whether two checkouts
 * racing for the last unit both succeed is decided by Postgres row locks, not
 * by anything a stub can imitate. These helpers create a database per run and
 * drop it afterwards, so the application database is never opened.
 */

/** Superuser connection used only to create and drop probe databases. */
export const ADMIN_URI =
  process.env.SECURITY_TEST_ADMIN_URI || 'postgresql://postgres:postgres@127.0.0.1:5433/postgres'

export async function serverReachable(): Promise<boolean> {
  try {
    const probe = new Client({ connectionString: ADMIN_URI, connectionTimeoutMillis: 3000 })
    await probe.connect()
    await probe.end()
    return true
  } catch {
    return false
  }
}

function uriFor(database: string): string {
  const url = new URL(ADMIN_URI)
  url.pathname = `/${database}`
  return url.toString()
}

export type ProbeDatabase = {
  name: string
  /** A fresh connection to the probe database. The caller closes it. */
  connect: () => Promise<Client>
  drop: () => Promise<void>
}

export async function createProbeDatabase(prefix: string): Promise<ProbeDatabase> {
  const name = `${prefix}_${process.pid}_${Date.now().toString(36)}`

  const bootstrap = new Client({ connectionString: ADMIN_URI })
  await bootstrap.connect()
  await bootstrap.query(`CREATE DATABASE ${name}`)
  await bootstrap.end()

  return {
    connect: async () => {
      const c = new Client({ connectionString: uriFor(name) })
      await c.connect()
      return c
    },
    drop: async () => {
      const admin = new Client({ connectionString: ADMIN_URI })
      await admin.connect()
      // Terminate stragglers, or DROP DATABASE blocks behind them.
      await admin
        .query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [name])
        .catch(() => {})
      await admin.query(`DROP DATABASE IF EXISTS ${name}`)
      const leftover = await admin.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [name])
      await admin.end()
      if (leftover.rowCount) throw new Error(`probe database ${name} was not dropped`)
    },
    name,
  }
}
