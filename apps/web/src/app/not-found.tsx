import Link from 'next/link'
import { ArrowRight, MapPinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-xl">
          <Card className="p-8">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                <MapPinOff className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  404
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tightish">
                  This page doesn&apos;t exist.
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Try one of the entry points below, or head back home.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/">
                  Home <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/sectors">Browse sectors</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/suggest">Suggest by capital</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
