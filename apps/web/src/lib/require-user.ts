import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUser, type CurrentUser } from './auth-server'

/**
 * Server-only auth gate for /dashboard/* pages. Redirects to /login when the
 * caller isn't signed in, preserving a `next` query param so the login flow
 * bounces them back after auth.
 *
 * Also handles the onboarding gate — when a signed-in user hasn't yet
 * completed OR explicitly skipped onboarding, redirect them to
 * /dashboard/onboarding. Pass `skipOnboardingGate: true` from inside the
 * onboarding page itself (or from routes we never want the user to hit
 * without finishing onboarding but where we want to render a soft prompt
 * instead of a redirect).
 */
export async function requireUser(opts?: {
  redirectTo?: string
  skipOnboardingGate?: boolean
}): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    const nextParam = opts?.redirectTo ?? '/dashboard'
    redirect(`/login?next=${encodeURIComponent(nextParam)}`)
  }
  if (!opts?.skipOnboardingGate && !user.onboardedAt && !user.onboardingSkippedAt) {
    redirect('/dashboard/onboarding')
  }
  return user
}

/**
 * Same as requireUser but returns null instead of redirecting when
 * unauthenticated — useful for server components that want to render an
 * empty state instead of forcing a redirect (e.g. a "sign up to save"
 * bookmark button on the public sector detail page).
 */
export async function optionalUser(): Promise<CurrentUser | null> {
  return getCurrentUser()
}
