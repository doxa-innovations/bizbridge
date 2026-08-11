'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth-server'

/**
 * Mark all notifications read by bumping the user's
 * notificationsLastSeenAt watermark to now.
 */
export async function markNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return { ok: false }

  const hdrs = await headers()
  try {
    await auth.api.updateUser({
      body: { notificationsLastSeenAt: new Date() } as never,
      headers: hdrs,
    })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notifications] mark-read failed', (err as Error).message)
    return { ok: false }
  }
}
