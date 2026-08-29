'use client'

import React, { useEffect, useState } from 'react'
import { Check, Mic2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Voice } from '@/contracts/tts'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type VoicePickerProps = {
  selectedVoiceId: string
  onSelectVoice: (voiceId: string) => void
  disabled?: boolean
}

export function VoicePicker({
  selectedVoiceId,
  onSelectVoice,
  disabled = false,
}: VoicePickerProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchVoices() {
      try {
        const res = await api.tts.voices({})
        if (mounted) {
          setVoices(res.data.voices)
          if (!selectedVoiceId && res.data.voices.length > 0) {
            onSelectVoice(res.data.voices[0].id)
          }
        }
      } catch (err) {
        console.warn('[VoicePicker] Error loading voices:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchVoices()
    return () => {
      mounted = false
    }
  }, [selectedVoiceId, onSelectVoice])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {voices.map((voice) => {
        const isSelected = voice.id === selectedVoiceId

        return (
          <button
            key={voice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectVoice(voice.id)}
            className={cn(
              'flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer',
              isSelected
                ? 'border-foreground bg-secondary/80 shadow-xs'
                : 'border-border bg-card hover:border-muted-foreground/50',
              disabled ? 'opacity-50 pointer-events-none' : '',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                <Mic2 className="h-3.5 w-3.5" />
                <span>{voice.name}</span>
              </div>
              {isSelected ? <Check className="h-3.5 w-3.5 text-foreground" /> : null}
            </div>

            {voice.description ? (
              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                {voice.description}
              </p>
            ) : null}

            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span>{voice.language}</span>
              <span>·</span>
              <span className="capitalize">{voice.gender || 'neutral'}</span>
              <span>·</span>
              <span className="uppercase">{voice.provider}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
