import React from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LatencyBadgeProps = {
  latencyMs?: number | null
  className?: string
}

export function LatencyBadge({ latencyMs, className }: LatencyBadgeProps) {
  if (latencyMs === undefined || latencyMs === null) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-card text-muted-foreground select-none',
        className,
      )}
      title="Latency from speech end to first generated audio turn"
    >
      <Timer className="h-3 w-3" />
      <span>{latencyMs}ms</span>
    </div>
  )
}
