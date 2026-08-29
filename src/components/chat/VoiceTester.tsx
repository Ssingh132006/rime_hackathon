'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Radio,
  Layers,
} from 'lucide-react'
import { AudioRecorder } from '@/lib/audio/recorder'
import { AudioPlayerQueue } from '@/lib/audio/player-queue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function VoiceTester() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedSizeKb, setRecordedSizeKb] = useState<number>(0)
  const [isPlayingQueue, setIsPlayingQueue] = useState(false)
  const [queueCount, setQueueCount] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const recorderRef = useRef<AudioRecorder | null>(null)
  const playerQueueRef = useRef<AudioPlayerQueue | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    recorderRef.current = new AudioRecorder()
    playerQueueRef.current = new AudioPlayerQueue(
      (playing) => {
        setIsPlayingQueue(playing)
        if (!playing) {
          setQueueCount(0)
        }
      },
      (chunkIndex, remaining) => {
        setQueueCount(remaining + 1)
      },
    )

    return () => {
      recorderRef.current?.stop()
      playerQueueRef.current?.interrupt()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Start / Stop Recording User's Voice
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setIsRecording(false)
      setAudioLevel(0)

      const finalBlob = await recorderRef.current?.stop()

      if (finalBlob && finalBlob.size > 0) {
        const url = URL.createObjectURL(finalBlob)
        const sizeKb = Number((finalBlob.size / 1024).toFixed(1))
        setRecordedAudioUrl(url)
        setRecordedSizeKb(sizeKb)
        setStatusMessage(
          `Voice captured (${sizeKb} KB, ${recordSeconds || 1}s). Click "Play Voice" to stream through the audio queue.`,
        )
      } else {
        setStatusMessage('No audio data captured. Please check microphone permissions and try again.')
      }
    } else {
      setRecordedAudioUrl(null)
      setRecordedSizeKb(0)
      setRecordSeconds(0)
      setStatusMessage(null)

      try {
        await recorderRef.current?.start(
          () => {},
          (vol) => {
            setAudioLevel(vol)
          },
          250,
        )

        setIsRecording(true)
        timerRef.current = setInterval(() => {
          setRecordSeconds((prev) => prev + 1)
        }, 1000)
      } catch (err) {
        setStatusMessage(`Microphone access error: ${(err as Error).message}`)
      }
    }
  }

  // Play Back the Recorded Voice via Audio Player Queue
  const handlePlayRecordedQueue = () => {
    if (!recordedAudioUrl) return

    playerQueueRef.current?.interrupt()
    setStatusMessage('Streaming your recorded voice through the playback queue...')

    playerQueueRef.current?.enqueue(recordedAudioUrl)
  }

  // Test Multi-Chunk Streamed Queue (Loops chunks to test continuous queueing)
  const handlePlayMultiChunkQueue = () => {
    if (!recordedAudioUrl) return

    playerQueueRef.current?.interrupt()
    setStatusMessage('Streaming multiple consecutive chunks through the audio queue...')

    playerQueueRef.current?.enqueue(recordedAudioUrl)
    playerQueueRef.current?.enqueue(recordedAudioUrl)
    playerQueueRef.current?.enqueue(recordedAudioUrl)
    setQueueCount(3)
  }

  // Immediately Interrupt the Playback
  const handleInterrupt = () => {
    playerQueueRef.current?.interrupt()
    setIsPlayingQueue(false)
    setQueueCount(0)
    setStatusMessage('Playback interrupted! Audio queue was immediately flushed.')
  }

  // Reset Test
  const handleReset = () => {
    playerQueueRef.current?.interrupt()
    recorderRef.current?.stop()
    setIsRecording(false)
    setIsPlayingQueue(false)
    setRecordedAudioUrl(null)
    setRecordedSizeKb(0)
    setRecordSeconds(0)
    setAudioLevel(0)
    setStatusMessage(null)
  }

  const hasAudio = recordedAudioUrl !== null

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Voice Recording &amp; Audio Queue Tester
            </h3>
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase border border-border">
              Browser Audio Test
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Record your voice, test continuous queue streaming, and verify instant barge-in interruption.
          </p>
        </div>

        {hasAudio ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground font-mono gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        ) : null}
      </div>

      {/* Main Interactive Controls */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* 1. Record Voice Section */}
        <div className="flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mic className="h-4 w-4" /> 1. Record Your Voice
              </span>
              {isRecording ? (
                <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-foreground animate-ping" />
                  00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
                </span>
              ) : hasAudio ? (
                <span className="text-xs font-mono text-muted-foreground">
                  {recordedSizeKb} KB saved
                </span>
              ) : null}
            </div>

            {/* Live Audio Level Visualizer */}
            <div className="flex h-12 items-center justify-center gap-1 rounded-md border border-border bg-background px-4">
              {isRecording ? (
                <div className="flex items-center gap-1 w-full justify-center">
                  {[35, 70, 100, 60, 90, 50, 80, 40, 65, 85].map((height, i) => (
                    <span
                      key={i}
                      className="w-1 bg-foreground rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(4, audioLevel * height)}px`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs font-mono text-muted-foreground">
                  {hasAudio
                    ? `Voice ready (${recordedSizeKb} KB) · Ready to stream`
                    : 'Click "Record Voice" and speak into your mic'}
                </span>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant={isRecording ? 'default' : 'outline'}
            onClick={handleToggleRecord}
            className="w-full text-xs font-mono gap-2 cursor-pointer h-9"
          >
            {isRecording ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                {hasAudio ? 'Record Again' : 'Record Voice'}
              </>
            )}
          </Button>
        </div>

        {/* 2. Audio Queue & Interruption Section */}
        <div className="flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Volume2 className="h-4 w-4" /> 2. Test Audio Queue &amp; Interrupt
              </span>
              {isPlayingQueue ? (
                <span className="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" /> Playing
                </span>
              ) : null}
            </div>

            {/* Playback Queue State Box */}
            <div className="flex h-12 items-center justify-center rounded-md border border-border bg-background px-4">
              {isPlayingQueue ? (
                <div className="flex items-center gap-2 text-xs font-mono text-foreground">
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-1 bg-foreground h-2 animate-wave-bar" />
                    <span className="w-1 bg-foreground h-4 animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 bg-foreground h-3 animate-wave-bar" style={{ animationDelay: '0.4s' }} />
                  </span>
                  <span>Streaming audio queue ({queueCount} active)</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-muted-foreground">
                  {hasAudio
                    ? 'Ready to test queue streaming'
                    : 'Record voice first to test queue'}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!hasAudio || isRecording}
              onClick={handlePlayRecordedQueue}
              className="text-xs font-mono gap-1 cursor-pointer h-9 px-2 truncate"
              title="Stream single recorded voice turn through queue"
            >
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Play Voice</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!hasAudio || isRecording}
              onClick={handlePlayMultiChunkQueue}
              className="text-xs font-mono gap-1 cursor-pointer h-9 px-2 truncate"
              title="Enqueue 3 consecutive streamed chunks to test continuous queueing"
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Queue (3x)</span>
            </Button>

            <Button
              type="button"
              variant={isPlayingQueue ? 'default' : 'outline'}
              disabled={!isPlayingQueue}
              onClick={handleInterrupt}
              className={cn(
                'text-xs font-mono gap-1 cursor-pointer h-9 px-2 truncate transition-colors',
                isPlayingQueue
                  ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground border-border opacity-40',
              )}
              title="Immediately cancel audio playback and flush queue"
            >
              <Square className="h-3.5 w-3.5 fill-current shrink-0" />
              <span className="truncate">Interrupt</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-xs font-mono text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />
          <span>{statusMessage}</span>
        </div>
      ) : null}
    </div>
  )
}
