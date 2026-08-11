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
const AUTO_OPEN_DELAY_MS = 45_000 // 45s after landing so it doesn't ambush the user

interface Props {
  /** Server-side gate: only render+auto-open when this is true. Parent
   *  computes it from user tailoring (`enabled` when the user has
   *  finished onboarding AND is diaspora or foreign_investor). */
  enabled?: boolean
  /** Optional user-type override so we can tailor headline copy. */
  userType?: string | null
  /** Ignored when `enabled` is false — the modal is a no-op then. */
  autoOpen?: boolean
}

/**
 * Contextual pitch for Doxa Innovations, shown ONLY to onboarded
 * diaspora / foreign-investor users who look like real leads (they'll
 * need the software Doxa builds — bookings, delivery, POS, sites — as
 * they set up in-country). Local Ethiopian users don't see this;
 * they're mostly here for the regulatory data, not to hire a studio.
 *
 * Snoozeable for ~2 weeks per user via localStorage.
 */
export function DoxaPromoModal({ enabled = false, userType, autoOpen = true }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!enabled || !autoOpen) return
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DISMISS_KEY) : null
    const dismissedUntil = raw ? Number(raw) : 0
    if (dismissedUntil && Date.now() < dismissedUntil) return

    const timer = setTimeout(() => setOpen(true), AUTO_OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [enabled, autoOpen])

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

  // When disabled, render nothing so the marketing pitch doesn't reach
  // local users or anyone who hasn't finished onboarding.
  if (!enabled) return null

  const headline =
    userType === 'diaspora'
      ? 'Opening from abroad?'
      : userType === 'foreign_investor'
        ? 'Setting up in Ethiopia?'
        : 'Building your product?'

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
                A note from Cheri
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
              {headline}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-ink-muted">
              Full disclosure — BizBridge and{' '}
              <a
                href="https://doxaplc.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                Doxa Innovations
              </a>{' '}
              are both built by the same team in Bishoftu. Once the paperwork is behind you,
              you&apos;ll probably need software — a booking site, a delivery integration, a
              POS, a customer portal. Doxa builds those for Ethiopian operators. Happy to
              scope it with you for free.
            </DialogDescription>
          </div>

          <ul className="grid gap-2 text-sm">
            <PromoBullet>Design → build → deploy under one roof</PromoBullet>
            <PromoBullet>Web + iOS + Android in the same sprint</PromoBullet>
            <PromoBullet>Local payments: Telebirr, CBE Birr, Chapa</PromoBullet>
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
                href="https://t.me/cherireal7"
                target="_blank"
                rel="noreferrer"
                onClick={() => dismiss(true)}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Message Cheri
              </a>
            </Button>
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="ml-auto text-xs text-ink-faint hover:text-ink"
            >
              Not interested
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
