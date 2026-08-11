import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tightish text-ink">Pick a new password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Choose something 8+ characters and hit save — we&apos;ll log you in automatically.
      </p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        Changed your mind?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
