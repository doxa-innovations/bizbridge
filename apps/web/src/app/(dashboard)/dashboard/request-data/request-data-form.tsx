'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, MessageCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

/**
 * Minimal ask. What you need + optional screenshot. Screenshot is
 * optional so users who can't upload (spotty connection, phone camera
 * lag, etc.) can still submit — instructions to DM the screenshot on
 * Telegram appear inline as the alternative.
 */
export function RequestDataForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Tell us what you need in a sentence.')
      return
    }

    const form = new FormData()
    form.append('requestType', 'custom')
    form.append('customTitle', title.trim())
    if (note.trim()) form.append('customNotes', note.trim())
    // Placeholders — admin reads the real values off the screenshot
    // (or the follow-up Telegram DM) at verify.
    form.append('paymentMethod', 'telebirr')
    form.append('amountEtb', '0')
    if (file) form.append('screenshot', file)

    startTransition(async () => {
      try {
        const res = await fetch('/api/report-requests', { method: 'POST', body: form })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Request failed (${res.status})`)
        }
        router.replace('/dashboard/requests')
        router.refresh()
      } catch (err) {
        setError((err as Error).message ?? 'Could not submit request.')
      }
    })
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">What do you need?</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "MOR fee schedule for sector 39141"'
            className="mt-1.5"
            maxLength={200}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="screenshot">Payment screenshot</Label>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Optional
            </span>
          </div>
          <label
            htmlFor="screenshot"
            className={cn(
              'mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm transition-colors',
              file
                ? 'border-brand/60 bg-brand/5 text-ink'
                : 'border-border/70 bg-surface text-ink-muted hover:border-brand/40',
            )}
          >
            <Upload className="h-4 w-4" />
            {file ? file.name : 'Attach PNG / JPEG / WebP (up to 5 MB)'}
            <input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
          {file ? (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-faint hover:text-danger"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          ) : null}
          <div className="mt-2 rounded-md border border-border/60 bg-surface/40 p-3 text-[11px] leading-relaxed text-ink-muted">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <MessageCircle className="h-3 w-3" /> Can&apos;t upload right now?
            </p>
            <p className="mt-1">
              Skip the file and submit — then DM your Telebirr / CBE Birr screenshot to{' '}
              <a
                href="https://t.me/fidadelivery"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand hover:underline"
              >
                @fidadelivery
              </a>{' '}
              with your request title so we can match it. Verification takes 24–48 h either way.
            </p>
          </div>
        </div>

        <details className="rounded-md border border-border/70 bg-surface/50 p-3">
          <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
            Anything else we should know? (optional)
          </summary>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Deadline, sector codes, why you need it…"
            maxLength={600}
            className="mt-2 flex w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </details>

        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              Submit request <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
