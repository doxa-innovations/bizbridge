'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

type Method = 'telebirr' | 'cbe_birr'

const SOURCES: Array<{ value: string; label: string }> = [
  { value: 'mor', label: 'Ministry of Revenue (MOR)' },
  { value: 'motri', label: 'Ministry of Trade & Regional Integration' },
  { value: 'trade_bureau', label: 'Trade Bureau (regional)' },
  { value: 'eic', label: 'Ethiopian Investment Commission (EIC)' },
  { value: 'nbe', label: 'National Bank of Ethiopia (NBE)' },
  { value: 'customs', label: 'Customs Commission' },
  { value: 'csa', label: 'Central Statistics Agency (CSA)' },
  { value: 'other_gov', label: 'Other government body' },
  { value: 'other', label: 'Other' },
]

export function RequestDataForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<string>('mor')
  const [notes, setNotes] = useState('')
  const [amount, setAmount] = useState<number>(300)
  const [method, setMethod] = useState<Method>('telebirr')
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Describe what you need in a sentence.')
      return
    }
    if (!file) {
      setError('Attach the payment screenshot.')
      return
    }
    if (!reference.trim()) {
      setError('Enter the transaction reference number.')
      return
    }
    if (amount <= 0) {
      setError('Amount must be greater than 0.')
      return
    }

    const form = new FormData()
    form.append('requestType', 'custom')
    form.append('customTitle', title.trim())
    form.append('customSource', source)
    if (notes.trim()) form.append('customNotes', notes.trim())
    form.append('amountEtb', String(amount))
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
          <Label htmlFor="title">What do you need?</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "MOR Directive 17/2011 explanation manual — sector 39141 fee schedule"'
            className="mt-1.5"
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="source">Where does it come from?</Label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Dates, sector codes, why you need it, deadlines…"
            maxLength={800}
            className="mt-1.5 flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <Label htmlFor="amount">Amount (ETB)</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            step={50}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Typical procurement fee: ETB 150–800 depending on source. If we can&apos;t get
            it we refund in full.
          </p>
        </div>

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
