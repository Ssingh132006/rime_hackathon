'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api-client'
import { HistoryItem } from '@/contracts/history'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function HistoryList() {
  const pathname = usePathname()
  const [sessions, setSessions] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadHistory() {
      try {
        const res = await api.history.list({ limit: 10 })
        if (mounted) {
          setSessions(res.data.sessions)
        }
      } catch (err) {
        console.warn('[HistoryList] Failed to load sessions:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadHistory()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-2 px-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
        No recorded sessions yet.
      </div>
    )
  }

  return (
    <nav className="space-y-1 px-1">
      {sessions.map((session) => {
        const href = `/live-chat/${session.id}`
        const isActive = pathname === href

        return (
          <Link
            key={session.id}
            href={href}
            className={cn(
              'group flex flex-col gap-0.5 rounded-md px-2.5 py-2 text-xs transition-colors border',
              isActive
                ? 'bg-muted border-border font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-medium text-foreground">
                {session.title || 'Voice Session'}
              </span>
              <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {session.durationSeconds}s
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-2.5 w-2.5" />
                {session.turnCount} turns
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
