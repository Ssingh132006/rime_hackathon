import { WsClientEvent, WsServerEvent } from '@/contracts/chat'

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type WsClientOptions = {
  url?: string
  sessionId: string
  token?: string
  mockMode?: boolean
  onStatusChange?: (status: WsStatus) => void
  onEvent?: (event: WsServerEvent) => void
  onError?: (error: Error) => void
}

export class LiveChatWsClient {
  private ws: WebSocket | null = null
  private status: WsStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private mockTimer: NodeJS.Timeout | null = null
  private options: WsClientOptions

  constructor(options: WsClientOptions) {
    this.options = options
  }

  public connect(): void {
    if (this.options.mockMode) {
      this.setStatus('connected')
      return
    }

    const wsBase =
      this.options.url ||
      process.env.NEXT_PUBLIC_WS_BASE_URL ||
      'ws://localhost:8000'

    const url = `${wsBase.replace(/\/$/, '')}/ws/${encodeURIComponent(this.options.sessionId)}`

    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.setStatus('connected')
        this.send({
          type: 'start_session',
          sessionId: this.options.sessionId,
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsServerEvent
          this.options.onEvent?.(data)
        } catch (err) {
          console.error('[ws-client] Error parsing server message:', err)
        }
      }

      this.ws.onclose = (event) => {
        this.ws = null
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.setStatus('reconnecting')
          this.scheduleReconnect()
        } else {
          this.setStatus('disconnected')
        }
      }

      this.ws.onerror = (error) => {
        console.warn('[ws-client] WebSocket error:', error)
        this.options.onError?.(new Error('WebSocket connection error'))
        this.setStatus('error')
      }
    } catch (err) {
      console.warn('[ws-client] Connection creation failed:', err)
      this.setStatus('error')
    }
  }

  public send(event: WsClientEvent): void {
    if (this.options.mockMode) {
      this.handleMockClientEvent(event)
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    } else {
      console.warn('[ws-client] Cannot send message, WebSocket not connected')
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    if (this.mockTimer) clearTimeout(this.mockTimer)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setStatus('disconnected')
  }

  public getStatus(): WsStatus {
    return this.status
  }

  private setStatus(status: WsStatus): void {
    this.status = status
    this.options.onStatusChange?.(status)
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000)
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private handleMockClientEvent(event: WsClientEvent): void {
    if (event.type === 'start_session') {
      this.options.onEvent?.({
        type: 'provider_status',
        provider: 'rime',
      })
    } else if (event.type === 'text_message' || event.type === 'audio_chunk') {
      const isVoice = event.type === 'audio_chunk'
      const userText =
        event.type === 'text_message'
          ? event.content
          : 'Can you explain the Rime voice synthesis pipeline and how it achieves sub-150ms latency?'

      const turnId = `turn_${Date.now()}`

      // For microphone voice input, simulate incoming STT transcripts
      if (isVoice) {
        // 1. Partial transcript of user speech
        setTimeout(() => {
          this.options.onEvent?.({
            type: 'partial_transcript',
            role: 'user',
            text: userText,
            turnId: `u_${turnId}`,
          })
        }, 100)

        // 2. Final transcript of user speech
        setTimeout(() => {
          this.options.onEvent?.({
            type: 'final_transcript',
            role: 'user',
            text: userText,
            turnId: `u_${turnId}`,
          })
        }, 300)
      }

      // 3. Partial transcript & audio chunks of assistant response
      const responseWords = [
        'Rime',
        'delivers',
        'high-speed',
        'voice',
        'synthesis',
        'engineered',
        'for',
        'seamless',
        'real-time',
        'dialogue',
        'with',
        'instant',
        'interruption',
        'recovery.',
      ]

      // Simulated sample audio chunk
      const sampleAudioUrl = 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'

      let accumulated = ''
      responseWords.forEach((word, idx) => {
        this.mockTimer = setTimeout(() => {
          accumulated += (idx === 0 ? '' : ' ') + word
          this.options.onEvent?.({
            type: 'partial_transcript',
            role: 'assistant',
            text: accumulated,
            turnId: `a_${turnId}`,
          })

          // Enqueue audio chunk on first word
          if (idx === 0) {
            this.options.onEvent?.({
              type: 'tts_audio_chunk',
              audioData: sampleAudioUrl,
              turnId: `a_${turnId}`,
              chunkIndex: 0,
              isLast: false,
              provider: 'rime',
            })
          }

          if (idx === responseWords.length - 1) {
            this.options.onEvent?.({
              type: 'final_transcript',
              role: 'assistant',
              text: accumulated,
              turnId: `a_${turnId}`,
              latencyMs: 138,
            })
          }
        }, 500 + idx * 120)
      })
    } else if (event.type === 'user_interrupt') {
      if (this.mockTimer) clearTimeout(this.mockTimer)
      this.options.onEvent?.({
        type: 'state_sync',
        turnId: 'current',
        deliveredText: 'Rime delivers high-speed voice synthesis...',
        interrupted: true,
      })
    }
  }
}
