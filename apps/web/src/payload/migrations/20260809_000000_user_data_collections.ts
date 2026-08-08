import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds five user-scoped collections that back the personalized /dashboard:
 *   saved_sectors, saved_reports, user_checklists (+ items array table),
 *   report_requests, news_sources.
 *
 * All tables live in the `payload` schema alongside the rest of the CMS.
 * user_id columns hold Better Auth user.id (public.user) as plain text —
 * no FK because it's a cross-schema reference; orphan cleanup is a separate
 * script.
 *
 * Additive migration: safe to run against the live Neon DB (no drops).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ---- Enums ------------------------------------------------------------
    CREATE TYPE "payload"."enum_report_requests_payment_method" AS ENUM('telebirr', 'cbe_birr');
    CREATE TYPE "payload"."enum_report_requests_status" AS ENUM('pending', 'verified', 'rejected');
    CREATE TYPE "payload"."enum_news_sources_type" AS ENUM('news_site', 'newspaper', 'tv', 'youtube', 'telegram', 'gov_portal', 'economic_data');
    CREATE TYPE "payload"."enum_news_sources_category" AS ENUM('business', 'policy', 'finance', 'sector_specific', 'general');

    -- ---- saved_sectors ---------------------------------------------------
    CREATE TABLE "payload"."saved_sectors" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "sector_id" integer NOT NULL,
      "saved_at" timestamp with time zone NOT NULL DEFAULT now(),
      "note" varchar,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE "payload"."saved_sectors"
      ADD CONSTRAINT "saved_sectors_sector_id_fk"
      FOREIGN KEY ("sector_id") REFERENCES "payload"."business_sectors"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "saved_sectors_user_id_idx" ON "payload"."saved_sectors" USING btree ("user_id");
    CREATE INDEX "saved_sectors_sector_id_idx" ON "payload"."saved_sectors" USING btree ("sector_id");
    CREATE UNIQUE INDEX "saved_sectors_user_sector_unique_idx" ON "payload"."saved_sectors" USING btree ("user_id", "sector_id");

    -- ---- saved_reports ---------------------------------------------------
    CREATE TABLE "payload"."saved_reports" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "report_id" integer NOT NULL,
      "saved_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE "payload"."saved_reports"
      ADD CONSTRAINT "saved_reports_report_id_fk"
      FOREIGN KEY ("report_id") REFERENCES "payload"."reports"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "saved_reports_user_id_idx" ON "payload"."saved_reports" USING btree ("user_id");
    CREATE INDEX "saved_reports_report_id_idx" ON "payload"."saved_reports" USING btree ("report_id");
    CREATE UNIQUE INDEX "saved_reports_user_report_unique_idx" ON "payload"."saved_reports" USING btree ("user_id", "report_id");

    -- ---- user_checklists + items ----------------------------------------
    CREATE TABLE "payload"."user_checklists" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "sector_id" integer NOT NULL,
      "progress_pct" numeric DEFAULT 0,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE "payload"."user_checklists"
      ADD CONSTRAINT "user_checklists_sector_id_fk"
      FOREIGN KEY ("sector_id") REFERENCES "payload"."business_sectors"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "user_checklists_user_id_idx" ON "payload"."user_checklists" USING btree ("user_id");
    CREATE INDEX "user_checklists_sector_id_idx" ON "payload"."user_checklists" USING btree ("sector_id");
    CREATE UNIQUE INDEX "user_checklists_user_sector_unique_idx" ON "payload"."user_checklists" USING btree ("user_id", "sector_id");

    CREATE TABLE "payload"."user_checklists_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_id" varchar NOT NULL,
      "completed" boolean DEFAULT false,
      "completed_at" timestamp with time zone,
      "note" varchar
    );

    ALTER TABLE "payload"."user_checklists_items"
      ADD CONSTRAINT "user_checklists_items_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."user_checklists"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "user_checklists_items_order_idx" ON "payload"."user_checklists_items" USING btree ("_order");
    CREATE INDEX "user_checklists_items_parent_id_idx" ON "payload"."user_checklists_items" USING btree ("_parent_id");

    -- ---- report_requests -------------------------------------------------
    CREATE TABLE "payload"."report_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "report_id" integer NOT NULL,
      "amount_etb" numeric NOT NULL,
      "amount_usd" numeric,
      "payment_method" "payload"."enum_report_requests_payment_method" NOT NULL,
      "payment_reference" varchar,
      "payment_screenshot_id" integer NOT NULL,
      "status" "payload"."enum_report_requests_status" NOT NULL DEFAULT 'pending',
      "admin_note" varchar,
      "verified_by_id" integer,
      "verified_at" timestamp with time zone,
      "download_expires_at" timestamp with time zone,
      "download_count" numeric DEFAULT 0,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE "payload"."report_requests"
      ADD CONSTRAINT "report_requests_report_id_fk"
      FOREIGN KEY ("report_id") REFERENCES "payload"."reports"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "payload"."report_requests"
      ADD CONSTRAINT "report_requests_payment_screenshot_id_fk"
      FOREIGN KEY ("payment_screenshot_id") REFERENCES "payload"."media"("id")
      ON DELETE restrict ON UPDATE no action;

    ALTER TABLE "payload"."report_requests"
      ADD CONSTRAINT "report_requests_verified_by_id_fk"
      FOREIGN KEY ("verified_by_id") REFERENCES "payload"."admins"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX "report_requests_user_id_idx" ON "payload"."report_requests" USING btree ("user_id");
    CREATE INDEX "report_requests_report_id_idx" ON "payload"."report_requests" USING btree ("report_id");
    CREATE INDEX "report_requests_status_idx" ON "payload"."report_requests" USING btree ("status");
    CREATE INDEX "report_requests_payment_method_idx" ON "payload"."report_requests" USING btree ("payment_method");

    -- ---- news_sources ----------------------------------------------------
    CREATE TABLE "payload"."news_sources" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "type" "payload"."enum_news_sources_type" NOT NULL,
      "url" varchar NOT NULL,
      "handle" varchar,
      "category" "payload"."enum_news_sources_category" DEFAULT 'general',
      "sector_hint_id" integer,
      "logo_id" integer,
      "description_en" varchar,
      "description_am" varchar,
      "priority" numeric DEFAULT 50,
      "is_active" boolean DEFAULT true,
      "allow_scrape" boolean DEFAULT false,
      "subscribers" numeric,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE "payload"."news_sources"
      ADD CONSTRAINT "news_sources_sector_hint_id_fk"
      FOREIGN KEY ("sector_hint_id") REFERENCES "payload"."business_sectors"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload"."news_sources"
      ADD CONSTRAINT "news_sources_logo_id_fk"
      FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX "news_sources_name_idx" ON "payload"."news_sources" USING btree ("name");
    CREATE INDEX "news_sources_type_idx" ON "payload"."news_sources" USING btree ("type");
    CREATE INDEX "news_sources_category_idx" ON "payload"."news_sources" USING btree ("category");
    CREATE INDEX "news_sources_is_active_idx" ON "payload"."news_sources" USING btree ("is_active");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."user_checklists_items";
    DROP TABLE IF EXISTS "payload"."user_checklists";
    DROP TABLE IF EXISTS "payload"."saved_sectors";
    DROP TABLE IF EXISTS "payload"."saved_reports";
    DROP TABLE IF EXISTS "payload"."report_requests";
    DROP TABLE IF EXISTS "payload"."news_sources";

    DROP TYPE IF EXISTS "payload"."enum_report_requests_payment_method";
    DROP TYPE IF EXISTS "payload"."enum_report_requests_status";
    DROP TYPE IF EXISTS "payload"."enum_news_sources_type";
    DROP TYPE IF EXISTS "payload"."enum_news_sources_category";
  `)
}
