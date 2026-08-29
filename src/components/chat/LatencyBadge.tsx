import React from 'react'
import { Timer, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LatencyBadgeProps = {
  latencyMs?: number | null
  label?: string
  icon?: 'timer' | 'zap'
  className?: string
  title?: string
}

export function LatencyBadge({
  latencyMs,
  label,
  icon = 'timer',
  className,
  title,
}: LatencyBadgeProps) {
  if (latencyMs === undefined || latencyMs === null) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-card text-muted-foreground select-none',
        className,
      )}
      title={title || `${label || 'Latency'}: ${latencyMs}ms`}
    >
      {icon === 'zap' ? <Zap className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
      <span>
        {label ? `${label}: ` : ''}
        {latencyMs}ms
      </span>
    </div>
  )
}
