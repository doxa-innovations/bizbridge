import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Sign up for BizBridge Ethiopia.',
}

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tightish text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Already have one?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
      <div className="mt-8">
        {/* Suspense boundary — SignupForm reads useSearchParams() for ?next=,
            which Next 15 requires to sit under Suspense so the surrounding
            page can still statically prerender. */}
        <Suspense fallback={<SignupSkeleton />}>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        Free forever · No card required
      </p>
    </div>
  )
}

function SignupSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
