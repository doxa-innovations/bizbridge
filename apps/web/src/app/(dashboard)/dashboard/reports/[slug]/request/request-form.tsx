'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

interface Props {
  report: { id: string; title: string; amountEtb: number }
}

/**
 * Just the screenshot. User already knows the report + price from the page
 * they're on; admin reads the payment method / reference / amount off the
 * image at verification time.
 */
export function RequestForm({ report }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!file) {
      setError('Attach the payment screenshot.')
      return
    }

    const form = new FormData()
    form.append('requestType', 'catalog')
    form.append('reportId', report.id)
    // Placeholder — admin reads method/ref off the screenshot at verify time.
    form.append('paymentMethod', 'telebirr')
    if (note.trim()) form.append('paymentReference', note.trim())
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
        <div className="rounded-md border border-border/70 bg-bg/50 p-3 text-xs text-ink-muted">
          Amount to send: <strong className="font-mono text-ink">ETB {report.amountEtb.toLocaleString()}</strong>
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
        </div>

        <details className="rounded-md border border-border/70 bg-surface/50 p-3">
          <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
            Anything to add? (optional)
          </summary>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Telebirr ref, notes for the reviewer…"
            maxLength={300}
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
