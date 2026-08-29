'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { GenerateTtsResponse } from '@/contracts/tts'
import { VoicePicker } from '@/components/tts/VoicePicker'
import { AudioPlayer } from '@/components/tts/AudioPlayer'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/common/ErrorState'

export function TtsForm() {
  const [text, setText] = useState(
    'Welcome to Rime voice intelligence. High fidelity, sub-150ms speech synthesis engineered for conversational agents.',
  )
  const [voiceId, setVoiceId] = useState('rime-mist')
  const [speed, setSpeed] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    data: GenerateTtsResponse
    source: 'mock' | 'live'
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !voiceId) return

    setLoading(true)
    setError(null)

    try {
      const res = await api.tts.generate({
        text: text.trim(),
        voiceId,
        speed,
        reduceLatency: true,
      })
      setResult(res)
    } catch (err) {
      console.error('[TtsForm] Generation error:', err)
      setError((err as Error).message || 'Failed to generate speech')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Text Input Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <label htmlFor="tts-text">Input Text</label>
            <span className="font-mono text-[11px]">{text.length} / 2000 chars</span>
          </div>
          <Textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Type or paste the text you want Rime to synthesize..."
            className="text-sm font-sans"
            required
          />
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Voice Model (Dynamic Rime Catalog)
          </div>
          <VoicePicker
            selectedVoiceId={voiceId}
            onSelectVoice={(id) => setVoiceId(id)}
            disabled={loading}
          />
        </div>

        {/* Speed / Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <label htmlFor="speed-slider" className="text-xs font-medium text-foreground">
              Pacing Speed:
            </label>
            <span className="font-mono text-xs font-semibold text-foreground">
              {speed.toFixed(2)}x
            </span>
            <input
              id="speed-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="accent-foreground cursor-pointer"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full sm:w-auto font-mono text-xs gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate Speech
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Error state */}
      {error ? (
        <ErrorState
          title="Synthesis Error"
          message={error}
          onRetry={() => handleGenerate({ preventDefault: () => {} } as React.FormEvent)}
        />
      ) : null}

      {/* Output Audio Player */}
      {result ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Synthesized Audio Output
          </div>
          <AudioPlayer
            audioUrl={result.data.audioUrl}
            durationSeconds={result.data.durationSeconds}
            latencyMs={result.data.latencyMs}
            provider={result.data.provider}
            source={result.source}
          />
        </div>
      ) : null}
    </div>
  )
}
