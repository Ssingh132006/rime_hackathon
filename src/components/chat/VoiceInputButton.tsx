'use client'

import React from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type VoiceInputButtonProps = {
  isRecording: boolean
  audioLevel?: number
  disabled?: boolean
  onClick: () => void
  className?: string
  size?: 'default' | 'lg'
}

export function VoiceInputButton({
  isRecording,
  audioLevel = 0,
  disabled = false,
  onClick,
  className,
  size = 'default',
}: VoiceInputButtonProps) {
  const isLarge = size === 'lg'

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Ripple ring for recording */}
      {isRecording ? (
        <span
          className="absolute rounded-full border border-foreground/40 pointer-events-none animate-ping"
          style={{
            inset: `-${Math.max(4, audioLevel * 16)}px`,
            opacity: Math.max(0.2, audioLevel),
          }}
        />
      ) : null}

      <Button
        type="button"
        variant={isRecording ? 'default' : 'outline'}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'relative rounded-full transition-all duration-200 border shadow-xs',
          isLarge ? 'h-16 w-16' : 'h-10 w-10',
          isRecording
            ? 'bg-foreground text-background border-foreground hover:bg-foreground/90'
            : 'bg-background hover:bg-muted text-foreground border-border',
          className,
        )}
        title={isRecording ? 'Stop speaking / release microphone' : 'Start voice conversation'}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <div className="flex items-center justify-center gap-0.5">
            <span
              className="w-1 bg-background rounded-full transition-all duration-75"
              style={{ height: `${Math.max(6, audioLevel * (isLarge ? 30 : 18))}px` }}
            />
            <span
              className="w-1 bg-background rounded-full transition-all duration-75"
              style={{ height: `${Math.max(12, audioLevel * (isLarge ? 40 : 24))}px` }}
            />
            <span
              className="w-1 bg-background rounded-full transition-all duration-75"
              style={{ height: `${Math.max(6, audioLevel * (isLarge ? 30 : 18))}px` }}
            />
          </div>
        ) : (
          <Mic className={cn(isLarge ? 'h-7 w-7' : 'h-4 w-4')} />
        )}
      </Button>
    </div>
  )
}
