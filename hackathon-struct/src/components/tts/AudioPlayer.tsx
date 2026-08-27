'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Download, Volume2, Sparkles, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LatencyBadge } from '@/components/chat/LatencyBadge'
import { ProviderBadge } from '@/components/chat/ProviderBadge'
import { MockBadge } from '@/components/common/MockBadge'
import { cn } from '@/lib/utils'

export type AudioPlayerProps = {
  audioUrl: string
  durationSeconds?: number
  latencyMs?: number
  provider?: 'rime' | 'fallback'
  source?: 'mock' | 'live'
  className?: string
}

export function AudioPlayer({
  audioUrl,
  durationSeconds,
  latencyMs,
  provider = 'rime',
  source = 'mock',
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationSeconds ?? 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs',
        className,
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Badges & Metrics Row */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ProviderBadge provider={provider} />
          {latencyMs ? <LatencyBadge latencyMs={latencyMs} /> : null}
        </div>
        <MockBadge source={source} />
      </div>

      {/* Main Playback Bar */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={togglePlay}
          className="h-11 w-11 rounded-full shadow-xs shrink-0 cursor-pointer"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        {/* Waveform Visualization Bars & Slider */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="relative flex items-center h-4">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-foreground cursor-pointer"
            />
          </div>
        </div>

        {/* Download Action */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 shrink-0"
        >
          <a href={audioUrl} download="rime-tts-output.mp3" title="Download audio file">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
