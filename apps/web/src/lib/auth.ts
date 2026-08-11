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
import { normalizeDatabaseUrl } from './db-url'
import { sendEmail } from './email'

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL)

const pool = new Pool({ connectionString })
const db = drizzle(pool, { schema })

/** Base URL Better Auth uses when it mints URLs in outgoing emails
 *  (password reset link, verification link). Without this, the server
 *  defaults to localhost — production reset emails then contain
 *  `https://localhost:3000/…` links that go nowhere. */
const authBaseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000'

export const auth = betterAuth({
  baseURL: authBaseURL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    /** Wired through the shared email helper — routes to Resend when
     *  RESEND_API_KEY is set, otherwise falls back to the Telegram
     *  admin bridge, otherwise logs to the server console (dev only). */
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your BizBridge password',
        text:
          `Hi ${user.name ?? 'there'},\n\n` +
          `Someone (hopefully you) asked to reset the password on your BizBridge account.\n\n` +
          `Open this link to pick a new one — it expires in 1 hour:\n\n` +
          `${url}\n\n` +
          `If it wasn't you, ignore this email and your password stays put.`,
      })
    },
    resetPasswordTokenExpiresIn: 3600,
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
      // Opt-in flag for marketing email (product updates, occasional
      // hand-written notes). Transactional email — password reset,
      // verification — is sent regardless.
      marketingOptIn: { type: 'boolean', required: false },
    },
  },
  /** Fires after any user row is created (signup). We use it to send a
   *  short welcome email through the shared sendEmail helper so a new
   *  user gets an acknowledgement + link back to /dashboard. Wrapped
   *  in try/catch so a mail-provider hiccup never blocks signup. */
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const appUrl =
              process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://biz.doxaplc.com'
            await sendEmail({
              to: user.email,
              subject: 'Welcome to BizBridge Ethiopia',
              text:
                `Hi ${user.name ?? 'there'},\n\n` +
                `Thanks for signing up. BizBridge is a free BI product for anyone opening a business in Ethiopia — 519 official MOR sectors, cost calculator, checklists, and a planning canvas.\n\n` +
                `Log in and finish the 30-second onboarding to tailor your dashboard:\n${appUrl}/dashboard\n\n` +
                `Reply to this email or DM @cherireal7 on Telegram if you get stuck.\n\n` +
                `— Cheri, BizBridge`,
            })
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[auth] welcome-email failed', err)
          }
        },
      },
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
