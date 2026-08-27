'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Mic,
  Volume2,
  LogOut,
  User as UserIcon,
  AudioWaveform,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HistoryList } from '@/components/history/HistoryList'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'

export type SidebarProps = {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Chat', href: '/live-chat', icon: Mic },
    { label: 'Text to Speech', href: '/text-to-speech', icon: Volume2 },
  ]

  const handleSignOut = async () => {
    await signOut('/sign-in')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card/60 select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background font-mono font-bold">
            <AudioWaveform className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider uppercase text-foreground">
              Voice Native
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Rime Hackathon
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Navigation */}
      <div className="p-3">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </div>
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
                  isActive
                    ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 my-1 border-t border-border" />

      {/* Past Chat Sessions History */}
      <div className="flex flex-1 flex-col overflow-hidden px-3 pt-2">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Chat History</span>
        </div>
        <ScrollArea className="flex-1 -mx-1 pr-1">
          <HistoryList />
        </ScrollArea>
      </div>

      {/* User Shell Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-foreground font-mono text-xs font-semibold overflow-hidden">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || 'User avatar'}
                  className="h-full w-full object-cover"
                />
              ) : user?.name ? (
                user.name.slice(0, 1).toUpperCase()
              ) : (
                <UserIcon className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-xs font-medium text-foreground leading-tight">
                {user?.name || 'Demo User'}
              </span>
              <span className="truncate text-[10px] text-muted-foreground leading-tight">
                {user?.email || 'judge@rime-hackathon.dev'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
