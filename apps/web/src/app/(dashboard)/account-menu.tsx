'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Home, LogOut, Settings, User as UserIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth-client'

interface Props {
  user: { id: string; email: string; name?: string | null }
}

function initials(name?: string | null, email?: string) {
  const source = (name ?? email ?? '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
}

export function AccountMenu({ user }: Props) {
  const router = useRouter()

  async function onSignOut() {
    await signOut()
    router.replace('/')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-surface-2 hover:border-border"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 font-mono text-[10px] text-brand">
            {initials(user.name, user.email)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs">
            {user.name ?? user.email}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-ink-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="min-w-[220px]">
        <DropdownMenuLabel className="px-2 py-1.5">
          <p className="text-xs text-ink-faint">Signed in as</p>
          <p className="truncate text-sm text-ink">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/onboarding">
            <UserIcon className="h-4 w-4" /> Interests + budget
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Marketing site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="text-danger data-[highlighted]:text-danger">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
