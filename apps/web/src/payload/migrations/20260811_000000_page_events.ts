import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `page_events` — product analytics stream. Additive, safe
 * against live Neon. Indexes cover the aggregation queries the
 * admin analytics page runs (top sectors, top searches, recent
 * activity per user/session).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_page_events_event_type" AS ENUM(
      'page_view', 'search', 'sector_view', 'tool_use',
      'signup', 'onboarding_complete', 'canvas_create',
      'report_request', 'suggestion_submit'
    );

    CREATE TABLE "payload"."page_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_type" "payload"."enum_page_events_event_type" NOT NULL,
      "path" varchar,
      "referrer" varchar,
      "user_id" varchar,
      "session_id" varchar,
      "country" varchar,
      "ua" varchar,
      "meta" jsonb,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX "page_events_event_type_idx" ON "payload"."page_events" USING btree ("event_type");
    CREATE INDEX "page_events_path_idx" ON "payload"."page_events" USING btree ("path");
    CREATE INDEX "page_events_user_id_idx" ON "payload"."page_events" USING btree ("user_id");
    CREATE INDEX "page_events_session_id_idx" ON "payload"."page_events" USING btree ("session_id");
    CREATE INDEX "page_events_created_at_idx" ON "payload"."page_events" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."page_events";
    DROP TYPE IF EXISTS "payload"."enum_page_events_event_type";
  `)
}
