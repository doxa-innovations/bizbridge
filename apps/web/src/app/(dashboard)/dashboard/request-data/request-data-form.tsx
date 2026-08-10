'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

/**
 * Minimal ask. Two fields, one button. Admin reads the payment method,
 * reference number and amount off the screenshot at verification time —
 * no need to make the user re-type what's already in the image.
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
    if (!file) {
      setError('Attach the payment screenshot.')
      return
    }

    const form = new FormData()
    form.append('requestType', 'custom')
    form.append('customTitle', title.trim())
    if (note.trim()) form.append('customNotes', note.trim())
    // Placeholders — admin reads the real values off the screenshot at
    // verification and updates the row.
    form.append('paymentMethod', 'telebirr')
    form.append('amountEtb', '0')
    form.append('screenshot', file)

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
          <Label htmlFor="screenshot">Payment screenshot</Label>
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
            {file ? file.name : 'PNG / JPEG / WebP up to 5 MB'}
            <input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
          <p className="mt-1 text-[11px] text-ink-faint">
            We read the amount, reference and method off the screenshot at verify time.
          </p>
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
