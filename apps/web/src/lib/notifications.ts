import 'server-only'
import { getPayloadClient } from './payload'
import type { CurrentUser } from './auth-server'

export interface NotificationItem {
  id: number
  status: 'verified' | 'rejected' | 'pending'
  title: string
  updatedAt: string
  href: string
}

/**
 * Notifications for the dashboard bell — derived from the user's own
 * report_requests where status changed after their
 * `notificationsLastSeenAt` timestamp. No separate notifications
 * collection needed for the MVP; if we add more event sources later
 * (canvas share views, mentions, etc.) it makes sense to introduce
 * one then.
 */
export async function loadNotifications(user: CurrentUser): Promise<{
  unread: number
  items: NotificationItem[]
}> {
  const since = user.notificationsLastSeenAt ?? user.createdAt ?? null
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'report-requests',
      where: {
        user_id: { equals: user.id },
        status: { in: ['verified', 'rejected'] },
      },
      sort: '-updatedAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
    })

    const items: NotificationItem[] = res.docs.map((r) => {
      const doc = r as {
        id: number | string
        status: 'verified' | 'rejected' | 'pending'
        custom_title?: string | null
        report?: { title?: string } | null
        updatedAt: string
      }
      const title =
        doc.custom_title ??
        (typeof doc.report === 'object' ? doc.report?.title : null) ??
        'Report request'
      return {
        id: Number(doc.id),
        status: doc.status,
        title,
        updatedAt: doc.updatedAt,
        href: '/dashboard/requests',
      }
    })

    // "unread" = rows where updatedAt strictly newer than the
    // last-seen watermark. If watermark is null, everything counts.
    const unread = items.filter((it) => {
      if (!since) return true
      return new Date(it.updatedAt).getTime() > new Date(since).getTime()
    }).length

    return { unread, items }
  } catch {
    return { unread: 0, items: [] }
  }
}
