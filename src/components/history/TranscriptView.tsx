'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageSquare, Sparkles } from 'lucide-react'
import { api } from '@/lib/api-client'
import { HistoryDetailResponse } from '@/contracts/history'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ProviderBadge } from '@/components/chat/ProviderBadge'
import { MockBadge } from '@/components/common/MockBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/common/ErrorState'

export type TranscriptViewProps = {
  sessionId: string
}

export function TranscriptView({ sessionId }: TranscriptViewProps) {
  const [detail, setDetail] = useState<{
    data: HistoryDetailResponse
    source: 'mock' | 'live'
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDetail() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.history.get({ sessionId })
        if (mounted) {
          setDetail(res)
        }
      } catch (err) {
        if (mounted) setError((err as Error).message || 'Failed to load session transcript')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadDetail()
    return () => {
      mounted = false
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          title="Could not load session"
          message={error || 'Session not found'}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  const { data: session, source } = detail

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      {/* Session Metadata Banner */}
      <div className="border-b border-border bg-card/40 p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/live-chat">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Live Chat
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ProviderBadge provider={session.provider} />
              <MockBadge source={source} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {session.title}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
              <span>Recorded {new Date(session.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.durationSeconds}s duration
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {session.turns.length} turns
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Turns List */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {session.turns.map((turn) => (
            <MessageBubble key={turn.id} turn={turn} />
          ))}
        </div>
      </div>
    </div>
  )
}
