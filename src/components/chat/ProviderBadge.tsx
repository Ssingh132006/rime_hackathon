import React from 'react'
import { Sparkles, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProviderBadgeProps = {
  provider?: 'rime' | 'fallback'
  className?: string
}

export function ProviderBadge({ provider = 'rime', className }: ProviderBadgeProps) {
  const isRime = provider === 'rime'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all select-none',
        isRime
          ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
          : 'bg-muted text-muted-foreground border-border border-dashed',
        className,
      )}
      title={isRime ? 'Speech Provider: Rime (Ultra-low latency)' : 'Speech Provider: Fallback active'}
    >
      {isRime ? (
        <Radio className="h-3 w-3 animate-pulse" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      <span>Speech: {isRime ? 'Rime' : 'Fallback'}</span>
    </div>
  )
}
