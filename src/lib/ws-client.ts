import { WsClientEvent, WsServerEvent } from '@/contracts/chat'

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type WsClientOptions = {
  url?: string
  sessionId: string
  token?: string
  mockMode?: boolean
  stressMode?: boolean
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
  private mockTimers: NodeJS.Timeout[] = []
  private currentGenerationId = 0
  private options: WsClientOptions

  constructor(options: WsClientOptions) {
    this.options = options
  }

  public setStressMode(enabled: boolean): void {
    this.options.stressMode = enabled
  }

  public connect(): void {
    if (this.options.mockMode) {
      this.setStatus('connected')
      this.options.onEvent?.({
        type: 'provider_status',
        provider: 'rime',
        model: 'mistv3 / coda',
      })
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
          protocolVersion: 1,
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
    this.clearMockTimers()
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

  private clearMockTimers(): void {
    this.mockTimers.forEach((t) => clearTimeout(t))
    this.mockTimers = []
  }

  private handleMockClientEvent(event: WsClientEvent): void {
    if (event.type === 'start_session') {
      this.options.onEvent?.({
        type: 'provider_status',
        provider: 'rime',
        model: 'mistv3 / coda',
      })
    } else if (event.type === 'text_message' || event.type === 'audio_chunk') {
      // Monotonically increase generationId for fencing
      this.currentGenerationId++
      const myGenerationId = this.currentGenerationId
      this.clearMockTimers()

      const isVoice = event.type === 'audio_chunk'
      const userText =
        event.type === 'text_message'
          ? event.content
          : 'Can you check my order status and explain the Rime voice synthesis latency?'

      const turnId = `turn_${Date.now()}`

      // For microphone voice input, simulate incoming STT transcripts
      if (isVoice) {
        // 1. Partial transcript of user speech
        const t1 = setTimeout(() => {
          if (this.currentGenerationId !== myGenerationId) return // Fenced
          this.options.onEvent?.({
            type: 'partial_transcript',
            role: 'user',
            text: userText,
            turnId: `u_${turnId}`,
            generationId: myGenerationId,
          })
        }, 100)
        this.mockTimers.push(t1)

        // 2. Final transcript of user speech
        const t2 = setTimeout(() => {
          if (this.currentGenerationId !== myGenerationId) return // Fenced
          this.options.onEvent?.({
            type: 'final_transcript',
            role: 'user',
            text: userText,
            turnId: `u_${turnId}`,
            generationId: myGenerationId,
          })
        }, 250)
        this.mockTimers.push(t2)
      }

      // If stress mode is active, simulate a 3-second tool / LLM delay
      const initialDelay = this.options.stressMode ? 3000 : 350

      const responseWords = this.options.stressMode
        ? [
            '[Tool',
            'Completed]',
            'Order',
            '#8492',
            'verified.',
            'Rime',
            'delivers',
            'sub-150ms',
            'first-byte',
            'speech',
            'synthesis',
            'with',
            'instant',
            'barge-in',
            'fencing.',
          ]
        : [
            'Rime',
            'delivers',
            'ultra-low',
            'latency',
            'voice',
            'synthesis',
            'engineered',
            'for',
            'real-time',
            'dialogue',
            'with',
            'instant',
            'barge-in',
            'recovery.',
          ]

      const sampleAudioUrl = 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'

      let accumulated = ''
      responseWords.forEach((word, idx) => {
        const timer = setTimeout(() => {
          // Fencing check: discard if newer generation started or interrupted
          if (this.currentGenerationId !== myGenerationId) {
            return
          }

          accumulated += (idx === 0 ? '' : ' ') + word
          this.options.onEvent?.({
            type: 'partial_transcript',
            role: 'assistant',
            text: accumulated,
            turnId: `a_${turnId}`,
            generationId: myGenerationId,
          })

          // Enqueue audio chunk on first word
          if (idx === 0) {
            this.options.onEvent?.({
              type: 'tts_audio_chunk',
              audioData: sampleAudioUrl,
              turnId: `a_${turnId}`,
              chunkIndex: 0,
              isLast: false,
              generationId: myGenerationId,
              provider: 'rime',
            })
          }

          if (idx === responseWords.length - 1) {
            this.options.onEvent?.({
              type: 'final_transcript',
              role: 'assistant',
              text: accumulated,
              turnId: `a_${turnId}`,
              generationId: myGenerationId,
              latencyMs: this.options.stressMode ? 3120 : 124,
            })
          }
        }, initialDelay + idx * 120)

        this.mockTimers.push(timer)
      })
    } else if (event.type === 'user_interrupt') {
      // Invalidate the current generation
      this.currentGenerationId++
      this.clearMockTimers()

      this.options.onEvent?.({
        type: 'state_sync',
        turnId: `turn_int_${Date.now()}`,
        generationId: this.currentGenerationId,
        deliveredText: 'Rime delivers ultra-low latency voice synthesis...',
        interrupted: true,
        timeToSilenceMs: 84,
        ttfbMs: 112,
      })
    }
  }
}
