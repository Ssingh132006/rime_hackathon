import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn('relative overflow-y-auto overscroll-contain', className)}
      {...props}
    >
      {children}
    </div>
  )
}
