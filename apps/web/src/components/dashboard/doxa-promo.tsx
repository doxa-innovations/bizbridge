'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, Code2, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/cn'

const DISMISS_KEY = 'doxa-promo-dismissed-until'
const REMIND_LATER_DAYS = 14
const AUTO_OPEN_DELAY_MS = 20_000 // 20s after landing on the dashboard

/**
 * Marketing modal that promotes Doxa Innovations (the software studio behind
 * BizBridge) as a build-partner for people setting up businesses. Rendered
 * once per session per user, snoozeable for ~2 weeks via localStorage.
 *
 * Two entry points:
 *  - Auto-opens 20s after the user has landed on the dashboard, but only if
 *    they haven't dismissed within the snooze window.
 *  - Trigger prop lets any parent open it on demand ("Build with Doxa" pill).
 */
export function DoxaPromoModal({ autoOpen = true }: { autoOpen?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!autoOpen) return
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DISMISS_KEY) : null
    const dismissedUntil = raw ? Number(raw) : 0
    if (dismissedUntil && Date.now() < dismissedUntil) return

    const timer = setTimeout(() => setOpen(true), AUTO_OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [autoOpen])

  function dismiss(snooze: boolean) {
    setOpen(false)
    if (snooze) {
      const until = Date.now() + REMIND_LATER_DAYS * 24 * 60 * 60 * 1000
      try {
        window.localStorage.setItem(DISMISS_KEY, String(until))
      } catch {
        // localStorage may be unavailable in some contexts — non-fatal.
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss(true))}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        {/* Visual banner strip */}
        <div className="relative h-36 bg-gradient-to-br from-brand via-brand-strong to-brand-strong">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 1px, transparent 1px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '32px 32px, 24px 24px',
            }}
          />
          <div className="relative flex h-full items-center gap-3 px-6">
            <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-white/95 ring-1 ring-inset ring-white/40">
              <Image
                src="https://cdn.doxaplc.com/doxa-public/logo.png"
                alt="Doxa Innovations logo"
                width={56}
                height={56}
                className="h-full w-full object-contain p-1.5"
                unoptimized
              />
            </span>
            <div className="text-brand-foreground">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-80">
                Software partner
              </p>
              <p className="text-lg font-semibold tracking-tightish">Doxa Innovations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(true)}
            className="absolute right-3 top-3 rounded-md p-1 text-brand-foreground/70 transition-colors hover:bg-white/10 hover:text-brand-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tightish text-ink">
              Ready to build your product?
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-ink-muted">
              Doxa builds the tech spine behind BizBridge, Fida Delivery, and Classic Noodle.
              If you&apos;re past sector selection and need an actual product built —
              website, mobile app, backend, admin dashboard — Doxa can quote you.
            </DialogDescription>
          </div>

          <ul className="grid gap-2 text-sm">
            <PromoBullet>End-to-end: design, engineering, deployment</PromoBullet>
            <PromoBullet>Web + iOS + Android in the same sprint</PromoBullet>
            <PromoBullet>Ethiopian-payment integrations (Chapa, Telebirr, CBE)</PromoBullet>
            <PromoBullet>Post-launch support, not just handover</PromoBullet>
          </ul>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button asChild size="sm">
              <a
                href="https://doxaplc.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => dismiss(true)}
              >
                <Code2 className="h-3.5 w-3.5" /> Visit Doxa <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a
                href="https://t.me/Cherireal7"
                target="_blank"
                rel="noreferrer"
                onClick={() => dismiss(true)}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Message on Telegram
              </a>
            </Button>
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="ml-auto text-xs text-ink-faint hover:text-ink"
            >
              Remind me later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PromoBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-ink-muted">
      <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 text-brand')} />
      <span>{children}</span>
    </li>
  )
}
