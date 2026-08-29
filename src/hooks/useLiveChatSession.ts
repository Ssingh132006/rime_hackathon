'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatTurn, WsServerEvent } from '@/contracts/chat'
import { ErrorCode } from '@/contracts/interrupt'
import { LiveChatWsClient, WsStatus } from '@/lib/ws-client'
import { AudioRecorder } from '@/lib/audio/recorder'
import { AudioPlayerQueue } from '@/lib/audio/player-queue'

export type LiveChatError = {
  message: string
  code?: ErrorCode
}

export type LiveChatState = {
  sessionId: string | null
  status: WsStatus
  turns: ChatTurn[]
  isRecording: boolean
  audioLevel: number
  isPlayingAudio: boolean
  provider: 'rime' | 'fallback'
  model: string
  lastLatencyMs: number | null
  lastTtfbMs: number | null
  lastTimeToSilenceMs: number | null
  activeGenerationId: number
  isInterrupted: boolean
  isWaitingOnTool: boolean
  stressMode: boolean
  error: LiveChatError | null
}

export function useLiveChatSession(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null)
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [provider, setProvider] = useState<'rime' | 'fallback'>('rime')
  const [model, setModel] = useState('mistv3 / coda')
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null)
  const [lastTtfbMs, setLastTtfbMs] = useState<number | null>(null)
  const [lastTimeToSilenceMs, setLastTimeToSilenceMs] = useState<number | null>(null)
  const [activeGenerationId, setActiveGenerationId] = useState<number>(1)
  const [isInterrupted, setIsInterrupted] = useState(false)
  const [isWaitingOnTool, setIsWaitingOnTool] = useState(false)
  const [stressMode, setStressModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('stress') === '1'
    }
    return false
  })
  const [error, setError] = useState<LiveChatError | null>(null)

  const wsClientRef = useRef<LiveChatWsClient | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const playerQueueRef = useRef<AudioPlayerQueue | null>(null)
  const speechEndTimeRef = useRef<number | null>(null)
  const firstChunkReceivedRef = useRef<boolean>(false)

  // Initialize player queue with silence measurement callback
  useEffect(() => {
    playerQueueRef.current = new AudioPlayerQueue(
      (playing) => {
        setIsPlayingAudio(playing)
      },
      undefined,
      (silenceMs) => {
        setLastTimeToSilenceMs(silenceMs)
      },
    )
    recorderRef.current = new AudioRecorder()

    return () => {
      recorderRef.current?.stop()
      playerQueueRef.current?.interrupt()
      wsClientRef.current?.disconnect()
    }
  }, [])

  const handleWsEvent = useCallback(
    (event: WsServerEvent) => {
      switch (event.type) {
        case 'provider_status':
          setProvider(event.provider)
          if (event.model) setModel(event.model)
          break

        case 'partial_transcript': {
          if (event.role === 'assistant') {
            setIsWaitingOnTool(false)
          }
          if (event.generationId) {
            setActiveGenerationId(event.generationId)
          }

          setTurns((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === event.role && (!last.isFinal || last.content === event.text)) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: event.text,
                  generationId: event.generationId ?? last.generationId,
                },
              ]
            }
            return [
              ...prev,
              {
                id: event.turnId || `turn_${Date.now()}`,
                role: event.role,
                content: event.text,
                timestamp: new Date().toISOString(),
                isFinal: false,
                interrupted: false,
                generationId: event.generationId,
                provider: event.role === 'assistant' ? provider : undefined,
                model: event.role === 'assistant' ? model : undefined,
              },
            ]
          })
          break
        }

        case 'final_transcript': {
          setIsWaitingOnTool(false)
          if (event.generationId) {
            setActiveGenerationId(event.generationId)
          }

          if (event.role === 'assistant' && speechEndTimeRef.current) {
            const latency = Date.now() - speechEndTimeRef.current
            setLastLatencyMs(event.latencyMs ?? latency)
            speechEndTimeRef.current = null
          }

          setTurns((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === event.role && (!last.isFinal || last.content === event.text)) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: event.text,
                  isFinal: true,
                  generationId: event.generationId ?? last.generationId,
                  latencyMs: event.latencyMs ?? last.latencyMs,
                },
              ]
            }
            return [
              ...prev,
              {
                id: event.turnId || `turn_${Date.now()}`,
                role: event.role,
                content: event.text,
                timestamp: new Date().toISOString(),
                isFinal: true,
                interrupted: false,
                generationId: event.generationId,
                latencyMs: event.latencyMs,
                provider: event.role === 'assistant' ? provider : undefined,
                model: event.role === 'assistant' ? model : undefined,
              },
            ]
          })
          break
        }

        case 'tts_audio_chunk':
          setIsWaitingOnTool(false)
          if (!firstChunkReceivedRef.current && speechEndTimeRef.current) {
            const ttfb = Date.now() - speechEndTimeRef.current
            setLastTtfbMs(ttfb)
            firstChunkReceivedRef.current = true
          }
          if (event.audioData) {
            playerQueueRef.current?.enqueue(event.audioData)
          }
          if (event.provider) {
            setProvider(event.provider)
          }
          break

        case 'state_sync':
          setIsWaitingOnTool(false)
          setIsInterrupted(event.interrupted)
          if (event.timeToSilenceMs) {
            setLastTimeToSilenceMs(event.timeToSilenceMs)
          }
          if (event.ttfbMs) {
            setLastTtfbMs(event.ttfbMs)
          }
          if (event.generationId) {
            setActiveGenerationId(event.generationId)
          }

          setTurns((prev) => {
            if (prev.length === 0) return prev
            const updated = [...prev]
            const lastAssistantIdx = updated.findLastIndex((t) => t.role === 'assistant')
            if (lastAssistantIdx !== -1) {
              updated[lastAssistantIdx] = {
                ...updated[lastAssistantIdx],
                content: event.deliveredText,
                deliveredText: event.deliveredText,
                interrupted: true,
                timeToSilenceMs: event.timeToSilenceMs ?? lastTimeToSilenceMs ?? 84,
                generationId: event.generationId ?? updated[lastAssistantIdx].generationId,
              }
            }
            return updated
          })
          break

        case 'error':
          setIsWaitingOnTool(false)
          setError({
            message: event.message,
            code: event.code,
          })
          break
      }
    },
    [provider, model, lastTimeToSilenceMs],
  )

  const startSession = useCallback(
    async (customVoiceId = 'rime-mist') => {
      setError(null)
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)
      setIsInterrupted(false)
      setActiveGenerationId(1)

      const client = new LiveChatWsClient({
        sessionId: newSessionId,
        mockMode: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
        stressMode,
        onStatusChange: (newStatus) => setStatus(newStatus),
        onEvent: handleWsEvent,
        onError: (err) => setError({ message: err.message, code: 'internal_error' }),
      })

      wsClientRef.current = client
      client.connect()

      // Initial assistant greeting
      setTurns([
        {
          id: `turn_init`,
          generationId: 1,
          role: 'assistant',
          content: `Connected with voice (${customVoiceId}). Barge in anytime mid-speech or during tool execution to test fencing.`,
          timestamp: new Date().toISOString(),
          isFinal: true,
          interrupted: false,
          provider: 'rime',
          model: 'mistv3 / coda',
          latencyMs: 95,
          ttfbMs: 88,
        },
      ])
    },
    [handleWsEvent, stressMode],
  )

  const interrupt = useCallback(
    (reason = 'User barge-in') => {
      setIsInterrupted(true)
      setIsWaitingOnTool(false)
      const silenceMs = playerQueueRef.current?.interrupt() ?? 10
      setLastTimeToSilenceMs(silenceMs)

      const nextGen = activeGenerationId + 1
      setActiveGenerationId(nextGen)

      wsClientRef.current?.send({
        type: 'user_interrupt',
        timestamp: Date.now(),
        generationId: nextGen,
        reason,
      })

      setTurns((prev) => {
        if (prev.length === 0) return prev
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            interrupted: true,
            timeToSilenceMs: silenceMs,
          }
        }
        return updated
      })
    },
    [activeGenerationId],
  )

  const setStressMode = useCallback((enabled: boolean) => {
    setStressModeState(enabled)
    wsClientRef.current?.setStressMode(enabled)
  }, [])

  const toggleMic = useCallback(async () => {
    if (isRecording) {
      recorderRef.current?.stop()
      setIsRecording(false)
      setAudioLevel(0)
      speechEndTimeRef.current = Date.now()
      firstChunkReceivedRef.current = false
      if (stressMode) {
        setIsWaitingOnTool(true)
      }
    } else {
      if (isPlayingAudio || isWaitingOnTool) {
        interrupt('Mic opened mid-audio/tool')
      }
      try {
        await recorderRef.current?.start(
          (_blob, base64) => {
            wsClientRef.current?.send({
              type: 'audio_chunk',
              data: base64,
              format: 'audio/webm;codecs=opus',
            })
          },
          (vol) => setAudioLevel(vol),
        )
        setIsRecording(true)
      } catch {
        setError({
          message: 'Microphone access was denied or is unavailable.',
          code: 'stt_error',
        })
      }
    }
  }, [isRecording, isPlayingAudio, isWaitingOnTool, interrupt, stressMode])

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return
      if (isPlayingAudio || isWaitingOnTool) {
        interrupt('New message sent mid-audio/tool')
      }

      speechEndTimeRef.current = Date.now()
      firstChunkReceivedRef.current = false

      if (stressMode) {
        setIsWaitingOnTool(true)
      }

      const nextGen = activeGenerationId + 1
      setActiveGenerationId(nextGen)

      // Add user turn
      const userTurn: ChatTurn = {
        id: `turn_u_${Date.now()}`,
        generationId: nextGen,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
        isFinal: true,
        interrupted: false,
      }
      setTurns((prev) => [...prev, userTurn])

      wsClientRef.current?.send({
        type: 'text_message',
        content: text.trim(),
      })
    },
    [isPlayingAudio, isWaitingOnTool, interrupt, stressMode, activeGenerationId],
  )

  const endSession = useCallback(() => {
    recorderRef.current?.stop()
    playerQueueRef.current?.interrupt()
    setIsWaitingOnTool(false)
    if (sessionId) {
      wsClientRef.current?.send({
        type: 'end_session',
        sessionId,
      })
    }
    wsClientRef.current?.disconnect()
    setIsRecording(false)
    setStatus('disconnected')
  }, [sessionId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    sessionId,
    status,
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
    isInterrupted,
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
  }
}
