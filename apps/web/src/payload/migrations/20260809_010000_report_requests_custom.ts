import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Extend report_requests so users can request docs that aren't in the catalog
 * (e.g. "I want the MOR fee schedule PDF for sector 39141 Q3 2026" — no
 * matching report row exists, admin fulfills manually).
 *
 * Additive:
 *  - request_type enum ('catalog' | 'custom'), defaults to 'catalog' so
 *    existing rows keep their meaning
 *  - report_id becomes nullable (only required when request_type = catalog)
 *  - custom_title / custom_source / custom_notes for the free-form ask
 *  - fulfilled_asset_id points to the media doc the admin uploads once the
 *    document is procured, so users can download regardless of catalog state
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_report_requests_request_type" AS ENUM('catalog', 'custom');

    ALTER TABLE "payload"."report_requests"
      ADD COLUMN "request_type" "payload"."enum_report_requests_request_type" NOT NULL DEFAULT 'catalog';

    ALTER TABLE "payload"."report_requests" ALTER COLUMN "report_id" DROP NOT NULL;

    ALTER TABLE "payload"."report_requests"
      ADD COLUMN "custom_title" varchar,
      ADD COLUMN "custom_source" varchar,
      ADD COLUMN "custom_notes" varchar,
      ADD COLUMN "fulfilled_asset_id" integer;

    ALTER TABLE "payload"."report_requests"
      ADD CONSTRAINT "report_requests_fulfilled_asset_id_fk"
      FOREIGN KEY ("fulfilled_asset_id") REFERENCES "payload"."media"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX "report_requests_request_type_idx"
      ON "payload"."report_requests" USING btree ("request_type");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload"."report_requests_request_type_idx";
    ALTER TABLE "payload"."report_requests"
      DROP CONSTRAINT IF EXISTS "report_requests_fulfilled_asset_id_fk";
    ALTER TABLE "payload"."report_requests"
      DROP COLUMN IF EXISTS "fulfilled_asset_id",
      DROP COLUMN IF EXISTS "custom_notes",
      DROP COLUMN IF EXISTS "custom_source",
      DROP COLUMN IF EXISTS "custom_title",
      DROP COLUMN IF EXISTS "request_type";
    ALTER TABLE "payload"."report_requests" ALTER COLUMN "report_id" SET NOT NULL;
    DROP TYPE IF EXISTS "payload"."enum_report_requests_request_type";
  `)
}
