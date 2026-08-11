'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Loader2, MessageCirclePlus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

/**
 * Bug reports + feature suggestions widget. Renders as a collapsed
 * strip at the bottom of a page; expanding reveals a textarea + email
 * field that POSTs to /api/suggestions, which pipes into Cheri's inbox
 * (via Resend) with the current page path attached.
 *
 * Also shows the Telegram alternative for users who prefer that
 * channel or don't trust web forms — some Ethiopian users lean
 * heavily on Telegram over email.
 */
export function SuggestionBox({
  className,
  variant = 'inline',
}: {
  className?: string
  variant?: 'inline' | 'footer'
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 5) {
      setErrorMsg('A few more words, please.')
      return
    }
    setState('sending')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          contact: contact.trim(),
          page: pathname,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { hint?: string; error?: string }
        setErrorMsg(body.hint ?? body.error ?? 'Could not send — please try again.')
        setState('error')
        return
      }
      setState('sent')
      setMessage('')
      setContact('')
    } catch (err) {
      setErrorMsg((err as Error).message ?? 'Network error')
      setState('error')
    }
  }

  const paletteBg =
    variant === 'footer'
      ? 'border-border/70 bg-surface/60'
      : 'border-border bg-surface'

  return (
    <section className={cn('rounded-lg border p-4 sm:p-5', paletteBg, className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand/15 text-brand">
            <MessageCirclePlus className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Suggest an improvement</span>
            <span className="block text-[11px] text-ink-faint">
              Bug, feature idea, or something you found confusing — tell us.
            </span>
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          {open ? 'close' : 'open'}
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
          {state === 'sent' ? (
            <div className="flex items-start gap-2 rounded-md border border-brand/30 bg-brand/5 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div className="text-sm">
                <p className="font-semibold text-ink">Got it — thank you.</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Cheri reads every one. If you left contact info, expect a reply.
                </p>
                <button
                  type="button"
                  onClick={() => setState('idle')}
                  className="mt-2 text-[11px] text-ink-faint underline hover:text-ink"
                >
                  Send another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type what you'd change, add, or fix. Include steps if it's a bug."
                rows={4}
                maxLength={2000}
                required
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or Telegram handle (optional, for follow-up)"
                  maxLength={200}
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <Button type="submit" size="sm" disabled={state === 'sending'}>
                  {state === 'sending' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Send
                    </>
                  )}
                </Button>
              </div>
              {errorMsg ? (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {errorMsg}
                </p>
              ) : null}
              <p className="text-[11px] text-ink-faint">
                Prefer not to use the form? Email{' '}
                <a
                  href="mailto:cheridemeke777@gmail.com"
                  className="text-ink-muted hover:text-brand"
                >
                  cheridemeke777@gmail.com
                </a>{' '}
                or DM{' '}
                <a
                  href="https://t.me/cheri_figma"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-muted hover:text-brand"
                >
                  @cheri_figma
                </a>{' '}
                on Telegram.
              </p>
            </form>
          )}
        </div>
      ) : null}
    </section>
  )
}
