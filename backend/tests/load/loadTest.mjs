/**
 * Load test for the endpoints that carry the shop.
 *
 * Written in plain Node rather than k6 so it runs with no extra install: the
 * point is that whoever inherits this can re-run it, and a tool that has to be
 * downloaded first is a tool that does not get run.
 *
 * ## What it measures, and what it does not
 *
 * It drives real HTTP against a real server and a real Postgres, and reports
 * p50/p95/p99, throughput, error rate and the peak number of Postgres backends
 * observed during the run. That last number is the one that matters most for
 * the Vercel deployment: every warm instance keeps its own pool, so connection
 * count — not CPU — is the first ceiling this architecture hits.
 *
 * It is NOT a capacity model for production. It runs against a *development*
 * server (Turbopack, no build optimisation, source maps) on one machine that
 * is also running the database and the load generator. Absolute latencies here
 * are pessimistic and absolute throughput is meaningless; what is meaningful is
 * the *shape* — which endpoints degrade first, how error rate behaves as
 * concurrency climbs, and whether connections saturate.
 *
 * Usage:
 *   node tests/load/loadTest.mjs [--vus 100,500,1000] [--seconds 10]
 */
import { Client } from 'pg'

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'
const STOREFRONT = process.env.TEST_STOREFRONT_URL || 'http://127.0.0.1:3002'
const DB = process.env.DATABASE_URI || 'postgresql://postgres:postgres@127.0.0.1:5433/para_dhiver'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const LEVELS = argValue('vus', '100,500,1000').split(',').map(Number)
const SECONDS = Number(argValue('seconds', 10))

/** Distinct source address per virtual user: the rate limiter buckets by
 * client IP, and a load test that all came from one address would measure the
 * limiter rather than the endpoint. Real concurrent shoppers are distinct
 * clients; this reproduces that. */
const vuIp = (vu) => `10.${(vu >> 16) & 255}.${(vu >> 8) & 255}.${(vu & 255) || 1}`

const SCENARIOS = [
  { name: 'homepage (best-selling)', url: () => `${BASE}/api/homepage/best-selling?limit=20` },
  { name: 'catalogue (page 1)', url: () => `${STOREFRONT}/api/catalogue` },
  { name: 'catalogue (filtré + tri)', url: () => `${STOREFRONT}/api/catalogue?cat=Visage&sort=price-asc` },
  { name: 'facettes', url: () => `${BASE}/api/catalogue/facets` },
  {
    name: 'recherche prédictive',
    url: () => `${BASE}/api/search/suggest?q=${['cr', 'sun', 'av', 'dcp', 'so'][Math.floor(Math.random() * 5)]}`,
  },
  { name: 'fiche produit', url: () => `${BASE}/api/products?limit=1&depth=2&where=${encodeURIComponent(JSON.stringify({ isPublished: { equals: true } }))}` },
]

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

/** Peak Postgres backends seen while the run was in flight. Sampled rather
 * than derived, because the pool's own view says nothing about how many
 * connections the database is actually holding open. */
async function watchConnections(db, stop) {
  let peak = 0
  while (!stop.done) {
    try {
      const { rows } = await db.query(
        `SELECT count(*)::int n FROM pg_stat_activity WHERE datname = current_database() AND state IS NOT NULL`,
      )
      peak = Math.max(peak, rows[0].n)
    } catch {
      // A sampling failure must not end the run.
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  return peak
}

async function runScenario(scenario, vus, seconds, db) {
  const latencies = []
  const errorKinds = new Map()
  let errors = 0
  let rateLimited = 0
  let requests = 0

  // Error *kind* matters more than error count. A 500 from the application and
  // an ECONNRESET from the operating system's socket backlog are completely
  // different findings, and a bare percentage cannot tell them apart.
  const noteError = (kind) => errorKinds.set(kind, (errorKinds.get(kind) ?? 0) + 1)

  const stop = { done: false }
  const connectionWatcher = watchConnections(db, stop)
  const deadline = Date.now() + seconds * 1000

  const worker = async (vu) => {
    const headers = { 'X-Forwarded-For': vuIp(vu) }
    while (Date.now() < deadline) {
      const t0 = Date.now()
      try {
        const res = await fetch(scenario.url(), { headers })
        // Drain the body: without it the socket is not reusable and the
        // measurement includes teardown that a real client would not pay.
        await res.arrayBuffer()
        latencies.push(Date.now() - t0)
        requests += 1
        if (res.status === 429) rateLimited += 1
        else if (res.status >= 400) {
          errors += 1
          noteError(`HTTP ${res.status}`)
        }
      } catch (err) {
        errors += 1
        requests += 1
        noteError(err?.cause?.code || err?.code || err?.name || 'inconnue')
      }
    }
  }

  await Promise.all(Array.from({ length: vus }, (_, i) => worker(i + 1)))
  stop.done = true
  const peakConnections = await connectionWatcher

  latencies.sort((a, b) => a - b)
  return {
    errorKinds: [...errorKinds.entries()].sort((a, b) => b[1] - a[1]),
    errorRate: requests > 0 ? errors / requests : 0,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    peakConnections,
    rateLimited,
    requests,
    rps: Math.round(requests / seconds),
  }
}

const db = new Client({ connectionString: DB })
await db.connect()

console.log(`Cible : ${BASE} (backend) / ${STOREFRONT} (storefront)`)
console.log(`Paliers : ${LEVELS.join(', ')} utilisateurs simultanés · ${SECONDS}s par palier\n`)

for (const vus of LEVELS) {
  console.log(`── ${vus} utilisateurs simultanés ──`)
  console.log(
    'endpoint'.padEnd(26) +
      'req'.padStart(7) +
      'req/s'.padStart(7) +
      'p50'.padStart(7) +
      'p95'.padStart(8) +
      'p99'.padStart(8) +
      'err'.padStart(8) +
      '429'.padStart(7) +
      'conn'.padStart(6),
  )
  for (const scenario of SCENARIOS) {
    const r = await runScenario(scenario, vus, SECONDS, db)
    console.log(
      scenario.name.padEnd(26) +
        String(r.requests).padStart(7) +
        String(r.rps).padStart(7) +
        `${r.p50}ms`.padStart(7) +
        `${r.p95}ms`.padStart(8) +
        `${r.p99}ms`.padStart(8) +
        `${(r.errorRate * 100).toFixed(1)}%`.padStart(8) +
        String(r.rateLimited).padStart(7) +
        String(r.peakConnections).padStart(6),
    )
    if (r.errorKinds.length > 0) {
      console.log('    causes: ' + r.errorKinds.map(([k, n]) => `${k} x${n}`).join(', '))
    }
  }
  console.log('')
}

await db.end()
