import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `planning_canvases` — a user-owned free-form React Flow canvas.
 * Same cross-schema pattern as saved_sectors et al: user_id is Better Auth's
 * user.id in `public`, no FK. share_token is nullable + unique so the
 * partial-uniqueness works naturally in Postgres.
 *
 * Additive migration — safe against live Neon.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_planning_canvases_template" AS ENUM('blank', 'onboarding');

    CREATE TABLE "payload"."planning_canvases" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "title" varchar NOT NULL DEFAULT 'Untitled plan',
      "template" "payload"."enum_planning_canvases_template" NOT NULL DEFAULT 'blank',
      "nodes" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "edges" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "is_public" boolean NOT NULL DEFAULT false,
      "share_token" varchar,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX "planning_canvases_user_id_idx" ON "payload"."planning_canvases" USING btree ("user_id");
    CREATE UNIQUE INDEX "planning_canvases_share_token_unique_idx" ON "payload"."planning_canvases" USING btree ("share_token");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."planning_canvases";
    DROP TYPE IF EXISTS "payload"."enum_planning_canvases_template";
  `)
}
