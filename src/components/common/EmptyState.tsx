import React from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-border bg-card/40',
        className,
      )}
    >
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
