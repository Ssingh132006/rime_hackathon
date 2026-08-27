'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatTurn, WsServerEvent } from '@/contracts/chat'
import { LiveChatWsClient, WsStatus } from '@/lib/ws-client'
import { AudioRecorder } from '@/lib/audio/recorder'
import { AudioPlayerQueue } from '@/lib/audio/player-queue'

export type LiveChatState = {
  sessionId: string | null
  status: WsStatus
  turns: ChatTurn[]
  isRecording: boolean
  audioLevel: number
  isPlayingAudio: boolean
  provider: 'rime' | 'fallback'
  lastLatencyMs: number | null
  isInterrupted: boolean
  error: string | null
}

export function useLiveChatSession(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null)
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [provider, setProvider] = useState<'rime' | 'fallback'>('rime')
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null)
  const [isInterrupted, setIsInterrupted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsClientRef = useRef<LiveChatWsClient | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const playerQueueRef = useRef<AudioPlayerQueue | null>(null)
  const speechEndTimeRef = useRef<number | null>(null)

  // Initialize player queue
  useEffect(() => {
    playerQueueRef.current = new AudioPlayerQueue((playing) => {
      setIsPlayingAudio(playing)
    })
    recorderRef.current = new AudioRecorder()

    return () => {
      recorderRef.current?.stop()
      playerQueueRef.current?.interrupt()
      wsClientRef.current?.disconnect()
    }
  }, [])

  const handleWsEvent = useCallback((event: WsServerEvent) => {
    switch (event.type) {
      case 'provider_status':
        setProvider(event.provider)
        break

      case 'partial_transcript': {
        setTurns((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === event.role && !last.isFinal) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: event.text },
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
              provider: event.role === 'assistant' ? provider : undefined,
            },
          ]
        })
        break
      }

      case 'final_transcript': {
        if (event.role === 'assistant' && speechEndTimeRef.current) {
          const latency = Date.now() - speechEndTimeRef.current
          setLastLatencyMs(event.latencyMs ?? latency)
          speechEndTimeRef.current = null
        }

        setTurns((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === event.role && !last.isFinal) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: event.text,
                isFinal: true,
                latencyMs: event.latencyMs,
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
              latencyMs: event.latencyMs,
              provider: event.role === 'assistant' ? provider : undefined,
            },
          ]
        })
        break
      }

      case 'tts_audio_chunk':
        if (event.audioData) {
          playerQueueRef.current?.enqueue(event.audioData)
        }
        if (event.provider) {
          setProvider(event.provider)
        }
        break

      case 'state_sync':
        setIsInterrupted(event.interrupted)
        setTurns((prev) => {
          if (prev.length === 0) return prev
          const updated = [...prev]
          const lastAssistantIdx = updated.findLastIndex((t) => t.role === 'assistant')
          if (lastAssistantIdx !== -1) {
            updated[lastAssistantIdx] = {
              ...updated[lastAssistantIdx],
              content: event.deliveredText,
              interrupted: true,
            }
          }
          return updated
        })
        break

      case 'error':
        setError(event.message)
        break
    }
  }, [provider])

  const startSession = useCallback(
    async (customVoiceId = 'rime-mist') => {
      setError(null)
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)
      setIsInterrupted(false)

      const client = new LiveChatWsClient({
        sessionId: newSessionId,
        mockMode: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
        onStatusChange: (newStatus) => setStatus(newStatus),
        onEvent: handleWsEvent,
        onError: (err) => setError(err.message),
      })

      wsClientRef.current = client
      client.connect()

      // Initial assistant greeting
      setTurns([
        {
          id: `turn_init`,
          role: 'assistant',
          content: "I'm connected and listening via Rime speech synthesis. Speak or type below.",
          timestamp: new Date().toISOString(),
          isFinal: true,
          interrupted: false,
          provider: 'rime',
          latencyMs: 95,
        },
      ])
    },
    [handleWsEvent],
  )

  const interrupt = useCallback(() => {
    setIsInterrupted(true)
    playerQueueRef.current?.interrupt()
    wsClientRef.current?.send({
      type: 'user_interrupt',
      timestamp: Date.now(),
      reason: 'User manual interrupt',
    })
    setTurns((prev) => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      const lastIdx = updated.length - 1
      if (updated[lastIdx].role === 'assistant') {
        updated[lastIdx] = { ...updated[lastIdx], interrupted: true }
      }
      return updated
    })
  }, [])

  const toggleMic = useCallback(async () => {
    if (isRecording) {
      recorderRef.current?.stop()
      setIsRecording(false)
      setAudioLevel(0)
      speechEndTimeRef.current = Date.now()
    } else {
      if (isPlayingAudio) {
        interrupt()
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
        setError('Microphone access was denied or is unavailable.')
      }
    }
  }, [isRecording, isPlayingAudio, interrupt])

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return
      if (isPlayingAudio) {
        interrupt()
      }

      speechEndTimeRef.current = Date.now()

      // Add user turn
      const userTurn: ChatTurn = {
        id: `turn_u_${Date.now()}`,
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
    [isPlayingAudio, interrupt],
  )

  const endSession = useCallback(() => {
    recorderRef.current?.stop()
    playerQueueRef.current?.interrupt()
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

  return {
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
  }
}
