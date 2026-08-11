import 'server-only'
import { headers } from 'next/headers'
import { auth } from './auth'

export interface CurrentUser {
  id: string
  email: string
  name?: string | null
  // Onboarding / tailoring fields — mirror Better Auth additionalFields.
  fullName?: string | null
  phone?: string | null
  country?: string | null
  userType?: 'local' | 'diaspora' | 'foreign_investor' | null
  capitalTier?: 'solo' | 'micro' | 'small' | 'medium' | 'investment' | null
  interestSectors?: string[] | null
  interestCategories?: string[] | null
  onboardedAt?: Date | null
  onboardingSkippedAt?: Date | null
  locale?: 'en' | 'am' | null
  marketingOptIn?: boolean | null
  notificationsLastSeenAt?: Date | null
  createdAt?: Date | null
}

function parseJsonArray(raw: unknown): string[] | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : null
  } catch {
    return null
  }
}

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * Read the current session from Better Auth on the server. Safe to call from
 * Server Components — returns null if unauthenticated or on any error.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user) return null
    const u = session.user as CurrentUser & Record<string, unknown>
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      fullName: (u.fullName as string) ?? null,
      phone: (u.phone as string) ?? null,
      country: (u.country as string) ?? null,
      userType:
        (u.userType as 'local' | 'diaspora' | 'foreign_investor' | undefined) ?? null,
      capitalTier:
        (u.capitalTier as 'solo' | 'micro' | 'small' | 'medium' | 'investment' | undefined) ??
        null,
      interestSectors: parseJsonArray(u.interestSectors),
      interestCategories: parseJsonArray(u.interestCategories),
      onboardedAt: toDate(u.onboardedAt),
      onboardingSkippedAt: toDate(u.onboardingSkippedAt),
      locale: (u.locale as 'en' | 'am' | undefined) ?? null,
      marketingOptIn: typeof u.marketingOptIn === 'boolean' ? u.marketingOptIn : null,
      notificationsLastSeenAt: toDate(u.notificationsLastSeenAt),
      createdAt: toDate(u.createdAt),
    }
  } catch {
    return null
  }
}
