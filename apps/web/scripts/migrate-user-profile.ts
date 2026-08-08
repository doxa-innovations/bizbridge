/**
 * One-shot additive migration to add onboarding + tailoring columns to the
 * Better Auth `user` table. All columns are nullable so it's safe to run
 * against a populated prod DB — existing rows just get NULLs, which the app
 * treats as "not onboarded".
 *
 * Run once per environment:  pnpm tsx scripts/migrate-user-profile.ts
 *
 * Idempotent — uses ADD COLUMN IF NOT EXISTS.
 */
import 'dotenv/config'
import { Pool } from 'pg'

const COLUMNS = [
  { name: 'user_type', type: 'text' },
  { name: 'capital_tier', type: 'text' },
  { name: 'interest_sectors', type: 'text' },
  { name: 'interest_categories', type: 'text' },
  { name: 'onboarded_at', type: 'timestamp with time zone' },
  { name: 'onboarding_skipped_at', type: 'timestamp with time zone' },
  { name: 'locale', type: 'text' },
] as const

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const pool = new Pool({ connectionString })
  try {
    for (const { name, type } of COLUMNS) {
      const sql = `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "${name}" ${type}`
      process.stdout.write(`  · ${name} ... `)
      await pool.query(sql)
      process.stdout.write('ok\n')
    }
    const check = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user'
        AND column_name IN (${COLUMNS.map((c) => `'${c.name}'`).join(',')})
      ORDER BY column_name
    `)
    console.log('\nColumns present:')
    for (const row of check.rows) console.log(`  ${row.column_name.padEnd(24)} ${row.data_type}`)
    console.log(`\n${check.rows.length}/${COLUMNS.length} onboarding columns confirmed.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
