import React from 'react'
import { cn } from '@/lib/utils'

export type MockBadgeProps = {
  source?: 'mock' | 'live'
  className?: string
}

export function MockBadge({ source = 'mock', className }: MockBadgeProps) {
  const isMock = source === 'mock'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-tight border uppercase select-none',
        isMock
          ? 'bg-muted/80 text-muted-foreground border-dashed border-border'
          : 'bg-primary text-primary-foreground border-primary font-semibold',
        className,
      )}
      title={isMock ? 'Serving client-side mock data' : 'Connected to live backend'}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isMock ? 'bg-muted-foreground/60' : 'bg-primary-foreground animate-pulse',
        )}
      />
      {source}
    </span>
  )
}
