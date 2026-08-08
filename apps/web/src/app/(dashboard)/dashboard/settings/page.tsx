import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bell, KeyRound, Landmark, MapPin, Phone, UserCog } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { CAPITAL_TIER_META } from '@/lib/dashboard-tailoring'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireUser({ skipOnboardingGate: true })

  const tierMeta = user.capitalTier ? CAPITAL_TIER_META[user.capitalTier] : null

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Settings</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Your account.
        </h1>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold tracking-tightish">Profile</h2>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProfileRow label="Name" value={user.fullName ?? user.name ?? '—'} />
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow
            label="Phone"
            value={user.phone ?? '—'}
            icon={<Phone className="h-3.5 w-3.5" />}
          />
          <ProfileRow
            label="Country"
            value={user.country ?? '—'}
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <ProfileRow
            label="Audience"
            value={user.userType ? user.userType.replace('_', ' ') : '—'}
          />
          <ProfileRow label="Language" value={user.locale === 'am' ? 'አማርኛ' : 'English'} />
        </dl>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Landmark className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold tracking-tightish">Interests + budget</h2>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Powers what we recommend and how we sort your feed.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Interest areas
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.interestCategories && user.interestCategories.length > 0 ? (
                user.interestCategories.map((slug) => (
                  <Badge key={slug} variant="mono">
                    {slug.split('-')[0]}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-ink-muted">None set — dashboard will show generic content.</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Budget tier
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tierMeta ? (
                <>
                  <Badge variant="brand">{tierMeta.label}</Badge>
                  <span className="font-mono text-xs text-ink-muted">{tierMeta.range}</span>
                </>
              ) : (
                <p className="text-xs text-ink-muted">Not set.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard/onboarding">
              Update interests + budget <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-ink-muted" />
          <h2 className="text-lg font-semibold tracking-tightish">Notifications</h2>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Email notifications for report request updates and new reports in your sectors.
          Coming soon — enabled by default when we ship it.
        </p>
      </Card>

      <Card className="border-danger/30 p-6">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-danger" />
          <h2 className="text-lg font-semibold tracking-tightish">Danger zone</h2>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Signing out ends this session. To fully delete your account and all bookmarks,
          contact us — we don&apos;t yet have a self-service delete button.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/consult">Request account deletion</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ProfileRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink">
        {icon} {value}
      </dd>
    </div>
  )
}
