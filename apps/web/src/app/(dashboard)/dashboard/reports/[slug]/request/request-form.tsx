'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

interface Props {
  report: { id: string; title: string; amountEtb: number }
}

type Method = 'telebirr' | 'cbe_birr'

export function RequestForm({ report }: Props) {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('telebirr')
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!file) {
      setError('Attach the payment screenshot.')
      return
    }
    if (!reference.trim()) {
      setError('Enter the transaction reference number.')
      return
    }

    const form = new FormData()
    form.append('reportId', report.id)
    form.append('paymentMethod', method)
    form.append('paymentReference', reference.trim())
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
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label>Payment method</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['telebirr', 'cbe_birr'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                  method === m
                    ? 'border-brand bg-brand/10 text-ink'
                    : 'border-border/70 bg-surface text-ink-muted hover:border-brand/40',
                )}
              >
                {m === 'telebirr' ? 'Telebirr' : 'CBE Birr'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="reference">Transaction reference</Label>
          <Input
            id="reference"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. TEL1234567890"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="screenshot">Screenshot proof</Label>
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

        <div className="rounded-md border border-border/70 bg-bg/50 p-3 text-xs text-ink-muted">
          Amount to be verified: <strong className="font-mono text-ink">ETB {report.amountEtb.toLocaleString()}</strong>
        </div>

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
