/**
 * Better Auth server instance — runs directly inside Next.js as an
 * `/api/auth/[...all]` route handler. No separate Fastify service is required
 * for auth. Uses a lightweight pg connection so it doesn't conflict with
 * Payload's Drizzle pool.
 */
import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './auth-schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required for Better Auth. Set it in .env or your Vercel environment.',
  )
}

const pool = new Pool({ connectionString })
const db = drizzle(pool, { schema })

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once/day
  },
  user: {
    additionalFields: {
      fullName: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      country: { type: 'string', required: false },
      // Onboarding + tailoring signals used by /dashboard.
      // interestSectors + interestCategories are stored as JSON-encoded arrays.
      userType: { type: 'string', required: false },
      capitalTier: { type: 'string', required: false },
      interestSectors: { type: 'string', required: false },
      interestCategories: { type: 'string', required: false },
      onboardedAt: { type: 'date', required: false },
      onboardingSkippedAt: { type: 'date', required: false },
      locale: { type: 'string', required: false },
    },
  },
  // Trust every origin the app might legitimately be served from. Reading a
  // comma-separated TRUSTED_ORIGINS env lets ops add hostnames without a code
  // deploy; NEXT_PUBLIC_APP_URL is kept as a fallback for backwards compat.
  trustedOrigins: Array.from(
    new Set(
      [
        ...(process.env.TRUSTED_ORIGINS?.split(',') ?? []),
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
      ]
        .map((s) => s?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  ),
})
