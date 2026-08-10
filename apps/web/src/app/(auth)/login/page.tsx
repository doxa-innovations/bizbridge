import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your BizBridge Ethiopia account.',
}

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tightish text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Sign up
        </Link>
      </p>
      <div className="mt-8">
        {/* LoginForm uses useSearchParams() for ?next= — needs a Suspense
            boundary to satisfy Next 15's static prerender contract. */}
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        <Link href="/forgot-password" className="hover:text-ink">
          Forgot your password?
        </Link>
      </p>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
