import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Delivery attempt tracking, so a retry can be capped.
//
// Attempts live on the notification row rather than in a separate deliveries
// table: one row already *is* one (notification × channel) delivery — that is
// exactly what the dedupe key identifies. Splitting it would duplicate the
// channel and the status across two tables and give the retry two places to
// disagree about how many times it has run.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "attempts" numeric DEFAULT 0;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "last_attempt_at" timestamp(3) with time zone;
  `)

  // Rows that already reached a provider have had exactly one attempt; rows
  // still pending because nothing is configured have had none.
  await db.execute(sql`
    UPDATE "notifications"
       SET attempts = 1, last_attempt_at = COALESCE(sent_at, updated_at)
     WHERE attempts = 0 AND status IN ('sent', 'failed');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "attempts";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "last_attempt_at";
  `)
}
