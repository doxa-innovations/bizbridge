import 'server-only'
import type { CurrentUser } from './auth-server'

/**
 * Superadmin gate. Reads a comma-separated `ADMIN_EMAILS` env var
 * (set in Dokploy). A user is admin iff their session email is in
 * the list.
 *
 * Used by the CSV export and the analytics dashboard. Not tied to
 * the Payload `Admins` collection (which has its own login).
 */
export function isSuperAdmin(user: CurrentUser | null | undefined): boolean {
  if (!user?.email) return false
  const allow = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(user.email.toLowerCase())
}
