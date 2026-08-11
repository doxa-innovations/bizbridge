import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payment screenshot on a report request is now OPTIONAL. Users who
 * can't upload right now (spotty connection, phone lag, etc.) submit
 * without the file and DM the screenshot to admin via Telegram — matches
 * the existing pattern for other manual-payment flows.
 *
 * The API + form already treat the field as optional; this migration
 * makes the DB agree so an insert with a NULL payment_screenshot_id
 * doesn't 500 on a NOT NULL violation.
 *
 * Additive + safe against the live Neon table (only drops a constraint).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."report_requests"
      ALTER COLUMN "payment_screenshot_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Best-effort restore. Will fail if rows without a screenshot already
  // exist — the operator has to decide what to do with them (backfill
  // from Telegram, or purge them) before rolling back.
  await db.execute(sql`
    ALTER TABLE "payload"."report_requests"
      ALTER COLUMN "payment_screenshot_id" SET NOT NULL;
  `)
}
