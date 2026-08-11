import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Send yourself a reset link for your BizBridge account.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tightish text-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Enter the email on your account and we&apos;ll send you a link to pick a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
