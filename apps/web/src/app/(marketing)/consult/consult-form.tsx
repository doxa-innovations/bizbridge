'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONSULT_EMAIL, CONSULT_TELEGRAM } from '@/lib/flags'

type State = 'idle' | 'submitting' | 'sent' | 'error'

/** Submits to /api/consult, which delivers via Resend using the same
 *  sendEmail helper that powers the welcome + reset emails. Replaces
 *  the old Formsubmit.co dependency — one less third-party call, same
 *  inbox (CONSULT_EMAIL). */
export function ConsultForm() {
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    setErrorMessage(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const payload: Record<string, string> = {}
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string') payload[key] = value
    }

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          hint?: string
          error?: string
        }
        throw new Error(body.hint ?? body.error ?? `Request failed (${res.status})`)
      }
      setState('sent')
      form.reset()
    } catch (err) {
      setState('error')
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not send. Try Telegram or email directly.',
      )
    }
  }

  if (state === 'sent') {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tightish">Message received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          We&apos;ll get back to you at the address you provided — usually within a day or two.
          If it&apos;s urgent, message on Telegram.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <a href={CONSULT_TELEGRAM} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Open Telegram
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sectors">Keep browsing sectors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <p className="text-xs uppercase tracking-wider text-brand">Or send a note</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tightish">
        Tell us what you&apos;re working on
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        A couple sentences is enough. We&apos;ll reply from {CONSULT_EMAIL}.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sector">Sector interest (optional)</Label>
          <Input
            id="sector"
            name="sector"
            placeholder="e.g. software company, design studio, cafe, tour operator…"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="message">What are you working on?</Label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder="Business idea, where you're stuck, what would help most."
            className="mt-1.5 flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>

        <div>
          <Label htmlFor="contact_pref">Preferred contact (optional)</Label>
          <Input
            id="contact_pref"
            name="contact_pref"
            placeholder="Telegram @handle, phone number, or leave blank for email"
            className="mt-1.5"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={state === 'submitting'}
        >
          {state === 'submitting' ? 'Sending…' : 'Send message'}
        </Button>
        <p className="text-xs text-ink-faint">
          We&apos;ll never sell your details. Replies in a day or two.
        </p>
        {state === 'error' && errorMessage ? (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            {errorMessage} You can also reach us on{' '}
            <a
              href={CONSULT_TELEGRAM}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Telegram
            </a>{' '}
            or by email at{' '}
            <a href={`mailto:${CONSULT_EMAIL}`} className="underline">
              {CONSULT_EMAIL}
            </a>
            .
          </p>
        ) : null}
      </form>
    </>
  )
}
