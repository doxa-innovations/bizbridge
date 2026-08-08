/**
 * Better Auth React client. Uses the same origin as the browser by default,
 * so it works regardless of what NEXT_PUBLIC_APP_URL is set to in the deploy
 * environment. Falls back to the env var (or localhost in dev) only during
 * SSR/build where `window` is unavailable.
 *
 * Use from Client Components:
 *   const { signIn, signUp, signOut, useSession } = authClient
 */
import { createAuthClient } from 'better-auth/react'

const isBrowser = typeof window !== 'undefined'
const baseURL = isBrowser
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
