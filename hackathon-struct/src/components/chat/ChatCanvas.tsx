'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Send,
  Square,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Radio,
  AudioWaveform,
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
    status,
    turns,
    isRecording,
    audioLevel,
    isPlayingAudio,
    provider,
    lastLatencyMs,
    isInterrupted,
    error,
    startSession,
    endSession,
    sendMessage,
    toggleMic,
    interrupt,
  } = useLiveChatSession(initialSessionId)

  const [inputVal, setInputVal] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new transcript turns
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

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
    'How does Rime achieve low-latency voice synthesis?',
    'What happens when a user interrupts the voice stream?',
    'Compare Mist and Ember voice pronunciation models.',
    'Test phoneme intelligibility in high-speed dialogue.',
  ]

  const hasStarted = turns.length > 0 || isRecording || sessionId !== null

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Real-time Status Header */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-card/30 px-6 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <ProviderBadge provider={provider} />
          {lastLatencyMs ? <LatencyBadge latencyMs={lastLatencyMs} /> : null}

          {isPlayingAudio ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-muted/60 text-foreground">
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 bg-foreground h-2 animate-wave-bar" />
                <span className="w-0.5 bg-foreground h-3 animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                <span className="w-0.5 bg-foreground h-1.5 animate-wave-bar" style={{ animationDelay: '0.4s' }} />
              </span>
              <span>Playing TTS Stream</span>
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
          {isPlayingAudio || isRecording ? (
            <Button
              variant="outline"
              size="sm"
              onClick={interrupt}
              className="h-7 gap-1 text-xs border-foreground text-foreground hover:bg-muted font-mono"
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
        /* Gemini-style Centered Initial Landing State */
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <AudioWaveform className="h-8 w-8 text-foreground" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Voice-Native Live Chat
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
            Direct real-time voice streaming powered by Rime text-to-speech. Press the mic to talk or test rapid interruption handling.
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
              Suggested Test Prompts
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-left">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    startSession()
                    sendMessage(prompt)
                  }}
                  className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-all cursor-pointer text-left"
                >
                  &ldquo;{prompt}&rdquo;
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
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Error Banner if any */}
      {error ? (
        <div className="mx-6 mb-2 flex items-center gap-2 rounded-md border border-border bg-muted p-2 text-xs text-foreground font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
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
              placeholder={isRecording ? 'Listening to voice...' : 'Type a message or use the microphone...'}
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
