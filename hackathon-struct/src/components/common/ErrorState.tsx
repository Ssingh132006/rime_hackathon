import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/40 text-foreground',
        className,
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        {onRetry ? (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
