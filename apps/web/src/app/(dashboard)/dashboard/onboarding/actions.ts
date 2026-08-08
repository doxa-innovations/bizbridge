'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth-server'

type OnboardingPayload = {
  interestCategories: string[]
  interestSectors?: string[]
  capitalTier: string | null
  locale?: 'en' | 'am'
  phone?: string
  skip?: boolean
}

export async function submitOnboarding(payload: OnboardingPayload) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/onboarding')

  const now = new Date().toISOString()

  const patch: Record<string, unknown> = {
    interestCategories: JSON.stringify((payload.interestCategories ?? []).slice(0, 5)),
    interestSectors: JSON.stringify((payload.interestSectors ?? []).slice(0, 5)),
    capitalTier: payload.capitalTier ?? null,
  }
  if (payload.locale) patch.locale = payload.locale
  if (payload.phone) patch.phone = payload.phone
  if (payload.skip) {
    patch.onboardingSkippedAt = now
  } else {
    patch.onboardedAt = now
  }

  const hdrs = await headers()
  try {
    // Better Auth's updateUser expects the current user's headers; strip anything
    // sensitive by only forwarding cookie for session lookup.
    await auth.api.updateUser({
      // Better Auth's updateUser body is typed generically; cast to bypass the
      // record schema so the additionalFields we declared land correctly.
      body: patch as never,
      headers: hdrs,
    })
  } catch (err) {
    console.error('[onboarding] updateUser failed:', (err as Error).message)
    throw new Error('Could not save your preferences — try again in a moment.')
  }

  redirect('/dashboard')
}
