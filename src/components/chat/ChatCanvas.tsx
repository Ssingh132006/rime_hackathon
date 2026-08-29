'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Send,
  Square,
  AlertCircle,
  AudioWaveform,
  Activity,
  Hash,
  FlaskConical,
  X,
  Clock,
} from 'lucide-react'
import { useLiveChatSession } from '@/hooks/useLiveChatSession'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { VoiceInputButton } from '@/components/chat/VoiceInputButton'
import { ProviderBadge } from '@/components/chat/ProviderBadge'
import { LatencyBadge } from '@/components/chat/LatencyBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ChatCanvasProps = {
  initialSessionId?: string
}

export function ChatCanvas({ initialSessionId }: ChatCanvasProps) {
  const {
    sessionId,
    turns,
    isRecording,
    audioLevel,
    isPlayingAudio,
    provider,
    model,
    lastLatencyMs,
    lastTtfbMs,
    lastTimeToSilenceMs,
    activeGenerationId,
    isWaitingOnTool,
    stressMode,
    error,
    startSession,
    endSession,
    sendMessage,
    toggleMic,
    interrupt,
    setStressMode,
    clearError,
  } = useLiveChatSession(initialSessionId)

  const [inputVal, setInputVal] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new transcript turns
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isWaitingOnTool])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    if (!sessionId) {
      startSession()
    }
    sendMessage(inputVal)
    setInputVal('')
  }

  const samplePrompts = [
    {
      label: 'Order lookup (3s Tool Delay Test)',
      prompt: 'Can you check my order status for booking #8492?',
      stress: true,
    },
    {
      label: 'Interruption & recovery test',
      prompt: 'Wait, stop! Actually make that for next Tuesday instead.',
      stress: false,
    },
    {
      label: 'Rime TTS latency architecture',
      prompt: 'How does Rime achieve sub-150ms voice synthesis with word-level timestamps?',
      stress: false,
    },
    {
      label: 'Generation fencing explanation',
      prompt: 'Explain how generationId prevents stale LLM tool calls from being spoken.',
      stress: false,
    },
  ]

  const hasStarted = turns.length > 0 || isRecording || sessionId !== null

  const getErrorMessage = (code?: string) => {
    switch (code) {
      case 'stt_error':
        return 'Speech-to-Text error: Failed to capture or transcribe microphone audio.'
      case 'llm_error':
        return 'LLM reasoning error: Backend model failed or timed out.'
      case 'tts_error':
        return 'TTS synthesis error: Rime speech generation failed.'
      case 'provider_fallback':
        return 'Speech Provider Fallback: Switched from Rime to fallback provider.'
      case 'session_not_found':
        return 'Session not found: Live session has expired or was terminated.'
      case 'internal_error':
      default:
        return error?.message || 'An unexpected error occurred.'
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Real-time Status Header */}
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border bg-card/30 px-6 py-2 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <ProviderBadge provider={provider} model={model} />

          {/* Fencing Generation ID */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-card text-muted-foreground"
            title="Active Generation Fence ID (monotonically increases on each turn or interrupt)"
          >
            <Hash className="h-3 w-3" />
            <span>gen: #{activeGenerationId}</span>
          </div>

          {/* TTFB Badge */}
          {lastTtfbMs ? (
            <LatencyBadge latencyMs={lastTtfbMs} label="TTFB" icon="zap" title="Time to first audio byte" />
          ) : lastLatencyMs ? (
            <LatencyBadge latencyMs={lastLatencyMs} label="Latency" />
          ) : null}

          {/* Client-side Time to Silence */}
          {lastTimeToSilenceMs ? (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border select-none',
                lastTimeToSilenceMs <= 150
                  ? 'border-foreground/30 bg-muted text-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
              title="Client-side measured time from interrupt to audio silence (<150ms target)"
            >
              <Activity className="h-3 w-3" />
              <span>Silence: {lastTimeToSilenceMs}ms</span>
            </div>
          ) : null}

          {isPlayingAudio ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-muted/60 text-foreground">
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 bg-foreground h-2 animate-wave-bar" />
                <span className="w-0.5 bg-foreground h-3 animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                <span className="w-0.5 bg-foreground h-1.5 animate-wave-bar" style={{ animationDelay: '0.4s' }} />
              </span>
              <span>Playing Rime TTS</span>
            </div>
          ) : null}

          {isRecording ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border border-foreground bg-foreground text-background">
              <span className="h-1.5 w-1.5 rounded-full bg-background animate-ping" />
              <span>Listening...</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Stress Test Toggle */}
          <Button
            variant={stressMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStressMode(!stressMode)}
            className={cn(
              'h-7 gap-1 text-xs font-mono transition-all',
              stressMode
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'text-muted-foreground border-border hover:text-foreground',
            )}
            title="Inject artificial 3s backend tool latency to test barge-in cancellation (§1 acceptance test)"
          >
            <FlaskConical className="h-3 w-3" />
            <span>Stress Test (3s Tool)</span>
          </Button>

          {isPlayingAudio || isRecording || isWaitingOnTool ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => interrupt('Manual button click')}
              className="h-7 gap-1 text-xs border-foreground text-foreground hover:bg-muted font-mono font-semibold"
            >
              <Square className="h-3 w-3 fill-current" />
              Interrupt
            </Button>
          ) : null}

          {sessionId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={endSession}
              className="h-7 text-xs text-muted-foreground hover:text-foreground font-mono"
            >
              End Session
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSession()}
              className="h-7 text-xs font-mono"
            >
              Connect Live
            </Button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      {!hasStarted ? (
        /* Initial Landing State */
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <AudioWaveform className="h-8 w-8 text-foreground" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Voice-Native Interruption &amp; Recovery
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
            Real-time conversational streaming powered by Rime TTS with sub-150ms speech cancellation and generation fencing during tool execution.
          </p>

          <div className="my-8">
            <VoiceInputButton
              isRecording={isRecording}
              audioLevel={audioLevel}
              size="lg"
              onClick={() => {
                startSession()
                toggleMic()
              }}
            />
            <div className="mt-3 text-xs font-mono text-muted-foreground">
              Click to talk live with low-latency audio
            </div>
          </div>

          <div className="w-full space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Acceptance &amp; Test Prompts
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-left">
              {samplePrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.stress) setStressMode(true)
                    startSession()
                    sendMessage(item.prompt)
                  }}
                  className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-all cursor-pointer text-left space-y-1"
                >
                  <div className="font-semibold text-foreground font-mono text-[11px]">
                    {item.label}
                  </div>
                  <div className="text-muted-foreground line-clamp-2">
                    &ldquo;{item.prompt}&rdquo;
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Conversation Transcript Stream */
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {turns.map((turn) => (
              <MessageBubble key={turn.id} turn={turn} />
            ))}

            {/* In-flight Tool Call Waiting State */}
            {isWaitingOnTool && (
              <div className="rounded-xl border border-foreground/30 bg-muted/30 p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Executing Backend Tool / LLM Call (3.0s simulated latency)...</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => interrupt('Barge in during tool execution')}
                    className="h-6 text-[11px] border-foreground text-foreground hover:bg-muted font-mono"
                  >
                    <Square className="h-2.5 w-2.5 fill-current mr-1" />
                    Barge In Mid-Tool
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">
                  Barge in right now by speaking or typing a replacement request. The generation fence will discard this stale tool response immediately.
                </p>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Explicit Error Banner for all 6 Error Codes */}
      {error ? (
        <div className="mx-6 mb-2 flex items-center justify-between gap-2 rounded-md border border-border bg-muted p-3 text-xs text-foreground font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div>
              {error.code ? (
                <span className="font-bold mr-1 uppercase">[{error.code}]:</span>
              ) : null}
              <span>{getErrorMessage(error.code)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearError}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Bottom Floating Bar */}
      <div className="border-t border-border bg-card/60 p-4 backdrop-blur-xs">
        <form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-center gap-2">
          <VoiceInputButton
            isRecording={isRecording}
            audioLevel={audioLevel}
            onClick={toggleMic}
          />

          <div className="relative flex-1">
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isRecording
                  ? 'Listening to voice...'
                  : isWaitingOnTool
                    ? 'Tool call in progress... Type to interrupt and change request...'
                    : 'Type a message or use the microphone to talk...'
              }
              disabled={isRecording}
              className="pr-10 h-10 bg-background border-border"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!inputVal.trim() || isRecording}
              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
