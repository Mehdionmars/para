import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two small tables that make the public API safe to expose:
 * `idempotency_keys` and `rate_limits`.
 *
 * Both are deliberately in Postgres rather than Redis. There is no Redis in
 * this stack, and adding one would mean a second store to run, monitor and
 * fail over — for two workloads that are a handful of rows each. Postgres is
 * already the source of truth, already transactional, and already the thing
 * the checkout consults on every order.
 *
 * They are *not* Payload collections. Nothing in the admin UI should list
 * them, they have no access rules to evaluate, and both are written on the
 * hot path where a full Payload document lifecycle would be pure overhead.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ----------------------------------------------------------------
  // idempotency_keys
  // ----------------------------------------------------------------
  //
  // One row per (endpoint, client-supplied key). The primary key is the whole
  // mechanism: a replay loses the `INSERT ... ON CONFLICT DO NOTHING` race and
  // reads back the stored response instead of running the operation again.
  //
  // `state` distinguishes the two replays that matter:
  //   in_progress -> the first request is still running; the caller gets 409
  //                  rather than a second checkout racing the first.
  //   completed   -> the stored response is replayed verbatim.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "idempotency_keys" (
      "key"          varchar(255) NOT NULL,
      "endpoint"     varchar(128) NOT NULL,
      "state"        varchar(16)  NOT NULL DEFAULT 'in_progress',
      "status_code"  integer,
      "response"     jsonb,
      "request_hash" varchar(64)  NOT NULL,
      "created_at"   timestamp(3) with time zone NOT NULL DEFAULT now(),
      "completed_at" timestamp(3) with time zone,
      PRIMARY KEY ("endpoint", "key")
    );
  `)

  // The retention purge deletes by age.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idempotency_keys_created_at_idx" ON "idempotency_keys" ("created_at");
  `)

  // ----------------------------------------------------------------
  // rate_limits
  // ----------------------------------------------------------------
  //
  // Fixed-window counters. A sliding window would be more precise, but it
  // needs one row per request instead of one row per window, and precision is
  // not what this is for: Cloudflare handles volumetric abuse in front, and
  // this layer exists to stop the targeted, low-volume cases Cloudflare has
  // no way to recognise — password spraying one account, walking order
  // numbers, probing coupon codes.
  //
  // `window_start` is part of the primary key so a new window is a new row
  // rather than an update racing against readers: the whole increment is one
  // `INSERT ... ON CONFLICT DO UPDATE ... RETURNING hits`, atomic by
  // construction.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rate_limits" (
      "bucket"       varchar(200) NOT NULL,
      "window_start" timestamp(3) with time zone NOT NULL,
      "hits"         integer NOT NULL DEFAULT 0,
      PRIMARY KEY ("bucket", "window_start")
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "rate_limits_window_start_idx" ON "rate_limits" ("window_start");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "idempotency_keys";
    DROP TABLE IF EXISTS "rate_limits";
  `)
}
