/**
 * Admin recovery: set a new password for a Better Auth user directly, without
 * needing the email-based reset flow. Uses Better Auth's own password hasher
 * (via a locally-instantiated auth context) so the resulting hash is
 * compatible with the normal sign-in path — no schema drift.
 *
 * Usage:
 *   pnpm tsx scripts/set-password.ts <email> <new-password>
 *
 * Example:
 *   pnpm tsx scripts/set-password.ts cheridemeke777@gmail.com hunter2xy
 *
 * Refuses to run if new-password is under 8 chars (matches emailAndPassword
 * config in src/lib/auth.ts). We instantiate a local betterAuth() here
 * instead of importing from src/lib/auth.ts so this script isn't blocked by
 * the `import 'server-only'` guard on that file (tsx can't resolve it).
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { normalizeDatabaseUrl } from '../src/lib/db-url'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

// Minimal schema mirror — only what Better Auth needs to spin up its ctx.
const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

async function main() {
  const [emailRaw, newPassword] = process.argv.slice(2)
  if (!emailRaw || !newPassword) {
    console.error('Usage: pnpm tsx scripts/set-password.ts <email> <new-password>')
    process.exit(1)
  }
  const email = emailRaw.trim().toLowerCase()
  if (newPassword.length < 8) {
    console.error('New password must be at least 8 characters.')
    process.exit(1)
  }

  let connectionString: string
  try {
    connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL)
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema: { user, session, account, verification } })

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification }, usePlural: false }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret',
  })

  try {
    const userRes = await pool.query<{ id: string }>('SELECT id FROM "user" WHERE lower(email) = $1', [email])
    const userRow = userRes.rows[0]
    if (!userRow) {
      console.error(`No user found for ${email}.`)
      process.exit(1)
    }
    const accountRes = await pool.query<{ id: string }>(
      `SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential' LIMIT 1`,
      [userRow.id],
    )
    if (accountRes.rows.length === 0) {
      console.error(
        `User ${email} exists but has no credential account row — they may have signed in with an OAuth provider only. Aborting.`,
      )
      process.exit(1)
    }

    const ctx = await auth.$context
    const hashed = await ctx.password.hash(newPassword)

    await pool.query(
      `UPDATE account SET password = $1, updated_at = now() WHERE id = $2`,
      [hashed, accountRes.rows[0].id],
    )

    const verify = await ctx.password.verify({ hash: hashed, password: newPassword })
    if (!verify) {
      console.error('Post-write verify failed — refusing to leave the account in an unknown state.')
      process.exit(1)
    }

    console.log(`\n✓ Password reset for ${email}.`)
    console.log(`  Sign in at http://localhost:3000/login (or https://biz.doxaplc.com/login).`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
