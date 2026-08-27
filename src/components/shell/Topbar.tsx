import React from 'react'
import { ProviderBadge } from '@/components/chat/ProviderBadge'
import { MockBadge } from '@/components/common/MockBadge'
import { cn } from '@/lib/utils'

export type TopbarProps = {
  title: string
  subtitle?: string
  provider?: 'rime' | 'fallback'
  showProvider?: boolean
  source?: 'mock' | 'live'
  showMockBadge?: boolean
  action?: React.ReactNode
  className?: string
}

export function Topbar({
  title,
  subtitle,
  provider = 'rime',
  showProvider = false,
  source = 'mock',
  showMockBadge = true,
  action,
  className,
}: TopbarProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border bg-card/40 px-6 backdrop-blur-xs select-none',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {showProvider ? <ProviderBadge provider={provider} /> : null}
        {showMockBadge ? <MockBadge source={source} /> : null}
        {action ? <div className="ml-2">{action}</div> : null}
      </div>
    </header>
  )
}
