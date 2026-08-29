import React from 'react'
import { User, Sparkles, AlertOctagon, Hash } from 'lucide-react'
import { ChatTurn } from '@/contracts/chat'
import { LatencyBadge } from '@/components/chat/LatencyBadge'
import { cn } from '@/lib/utils'

export type MessageBubbleProps = {
  turn: ChatTurn
  className?: string
}

export function MessageBubble({ turn, className }: MessageBubbleProps) {
  const isUser = turn.role === 'user'
  const displayContent = turn.interrupted && turn.deliveredText ? turn.deliveredText : turn.content

  return (
    <div
      className={cn(
        'group flex flex-col gap-1.5 transition-opacity',
        isUser ? 'items-end' : 'items-start',
        className,
      )}
    >
      {/* Header with speaker, generation ID & latency badge */}
      <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-1">
          {isUser ? (
            <>
              <User className="h-3 w-3" />
              <span>You</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              <span>Assistant {turn.model ? `(${turn.model})` : '(Rime)'}</span>
            </>
          )}
        </div>

        {turn.generationId !== undefined ? (
          <span
            className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground"
            title="Monotonically increasing generationId for fencing"
          >
            <Hash className="h-2.5 w-2.5" />
            gen:{turn.generationId}
          </span>
        ) : null}

        {turn.ttfbMs ? (
          <LatencyBadge latencyMs={turn.ttfbMs} label="TTFB" icon="zap" />
        ) : turn.latencyMs ? (
          <LatencyBadge latencyMs={turn.latencyMs} />
        ) : null}

        {turn.interrupted ? (
          <span
            className="inline-flex items-center gap-1 rounded border border-foreground/40 bg-muted px-1.5 py-0.2 text-[10px] font-mono text-foreground font-semibold"
            title="Speech was interrupted mid-sentence and playback queue was flushed"
          >
            <AlertOctagon className="h-2.5 w-2.5" />
            INTERRUPTED
            {turn.timeToSilenceMs ? ` (${turn.timeToSilenceMs}ms)` : ''}
          </span>
        ) : null}
      </div>

      {/* Bubble Body */}
      <div
        className={cn(
          'max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed border transition-all',
          isUser
            ? 'bg-foreground text-background border-foreground font-normal'
            : 'bg-card text-foreground border-border shadow-xs',
          turn.interrupted ? 'border-dashed opacity-90' : '',
        )}
      >
        <div className="whitespace-pre-wrap">{displayContent}</div>

        {!turn.isFinal && (
          <span className="inline-block h-2 w-1.5 ml-1 bg-current animate-pulse align-middle" />
        )}
      </div>

      {/* Timestamp & metrics metadata */}
      <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground font-mono">
        <span>
          {new Date(turn.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
        {turn.interrupted && turn.deliveredText ? (
          <span>· Delivered text synced</span>
        ) : null}
      </div>
    </div>
  )
}
