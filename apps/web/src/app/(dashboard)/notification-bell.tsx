'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Bell, Check, CheckCircle2, XCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import { markNotificationsRead } from './notifications-actions'
import type { NotificationItem } from '@/lib/notifications'

/**
 * Dashboard notification bell. Server prop `initialUnread` +
 * `items` are pre-fetched by the layout; opening the popover marks
 * everything read (bumps the watermark) so subsequent renders show 0.
 * If items list is empty the button becomes a link to /dashboard/requests
 * so the user still has an obvious way to see history.
 */
export function NotificationBell({
  initialUnread,
  items,
}: {
  initialUnread: number
  items: NotificationItem[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && unread > 0) {
      startTransition(async () => {
        const res = await markNotificationsRead()
        if (res.ok) {
          setUnread(0)
          router.refresh()
        }
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${unread} unread)`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-surface text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 font-mono text-[9px] font-semibold text-brand-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {isPending ? (
            <span className="font-mono text-[10px] text-ink-faint">marking read…</span>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-faint">
              Nothing yet. When a report request is verified or rejected, it&apos;ll show up
              here.
            </p>
          ) : (
            items.map((it) => (
              <Link
                key={it.id}
                href={it.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 border-b border-border/60 p-3 last:border-0 hover:bg-surface-2"
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md',
                    it.status === 'verified'
                      ? 'bg-brand/15 text-brand'
                      : 'bg-danger/15 text-danger',
                  )}
                >
                  {it.status === 'verified' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-ink">
                    <span className="font-semibold">
                      {it.status === 'verified' ? 'Verified' : 'Needs attention'}:
                    </span>{' '}
                    {it.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                    {new Date(it.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-border p-2 text-center">
          <Link
            href="/dashboard/requests"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <Check className="h-3 w-3" /> Open all requests
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
