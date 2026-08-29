import { z } from 'zod'
import { defineContract } from './_kit'
import { ErrorCodeEnum } from './interrupt'

export const ChatTurnSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  deliveredText: z.string().optional(),
  timestamp: z.string(),
  isFinal: z.boolean().default(true),
  interrupted: z.boolean().default(false),
  latencyMs: z.number().optional(),
  ttfbMs: z.number().optional(),
  timeToSilenceMs: z.number().optional(),
  generationId: z.number().optional(),
  provider: z.enum(['rime', 'fallback']).optional(),
  model: z.string().optional(),
  audioUrl: z.string().optional(),
})
export type ChatTurn = z.infer<typeof ChatTurnSchema>

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  status: z.enum(['active', 'ended', 'interrupted']),
  provider: z.enum(['rime', 'fallback']),
  model: z.string().default('mistv3'),
  createdAt: z.string(),
  turns: z.array(ChatTurnSchema),
})
export type ChatSession = z.infer<typeof ChatSessionSchema>

export const CreateSessionInputSchema = z.object({
  voiceId: z.string().optional().default('rime-mist'),
  promptOverride: z.string().optional(),
  protocolVersion: z.number().optional().default(1),
})

export const CreateSessionResponseSchema = z.object({
  session: ChatSessionSchema,
  sessionId: z.string(),
  roomName: z.string(),
  livekitUrl: z.string(),
  token: z.string(),
  protocolVersion: z.number().default(1),
  wsUrl: z.string(),
})

// WebSocket & LiveKit Data Channel Message Schemas
export const WsClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('start_session'),
    sessionId: z.string(),
    voiceId: z.string().optional(),
    protocolVersion: z.number().optional().default(1),
  }),
  z.object({
    type: z.literal('audio_chunk'),
    data: z.string(),
    format: z.string().default('audio/webm;codecs=opus'),
  }),
  z.object({
    type: z.literal('text_message'),
    content: z.string(),
  }),
  z.object({
    type: z.literal('user_interrupt'),
    timestamp: z.number(), // epoch_ms integer
    reason: z.string().optional(),
    generationId: z.number().optional(),
  }),
  z.object({
    type: z.literal('end_session'),
    sessionId: z.string(),
  }),
])
export type WsClientEvent = z.infer<typeof WsClientEventSchema>

export const WsServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('partial_transcript'),
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    turnId: z.string().optional(),
    generationId: z.number().optional(),
  }),
  z.object({
    type: z.literal('final_transcript'),
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    turnId: z.string(),
    generationId: z.number().optional(),
    latencyMs: z.number().optional(),
  }),
  z.object({
    type: z.literal('tts_audio_chunk'),
    audioData: z.string(),
    turnId: z.string(),
    chunkIndex: z.number(),
    isLast: z.boolean(),
    generationId: z.number().optional(),
    provider: z.enum(['rime', 'fallback']).default('rime'),
  }),
  z.object({
    type: z.literal('provider_status'),
    provider: z.enum(['rime', 'fallback']),
    model: z.string().optional(),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('state_sync'),
    turnId: z.string(),
    generationId: z.number().optional(),
    deliveredText: z.string(),
    interrupted: z.boolean(),
    ttfbMs: z.number().optional(),
    timeToSilenceMs: z.number().optional(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
    code: ErrorCodeEnum.optional(),
  }),
])
export type WsServerEvent = z.infer<typeof WsServerEventSchema>

export const createSession = defineContract({
  method: 'POST',
  path: '/api/chat/session',
  auth: 'user',
  summary: 'Initializes a new real-time voice chat session with LiveKit room tokens and fallback WS',
  input: CreateSessionInputSchema,
  output: CreateSessionResponseSchema,
  mock: (input) => {
    const id = `session_${Date.now()}`
    return {
      sessionId: id,
      roomName: `room_${id}`,
      livekitUrl: process.env.LIVEKIT_URL || 'wss://livekit.rime-hackathon.dev',
      token: `mock_jwt_token_${id}`,
      protocolVersion: input.protocolVersion ?? 1,
      wsUrl: `ws://localhost:8000/ws/${id}`,
      session: {
        id,
        userId: 'user_demo',
        title: 'Voice Session ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active' as const,
        provider: 'rime' as const,
        model: 'mistv3 / coda',
        createdAt: new Date().toISOString(),
        turns: [
          {
            id: 'turn_0',
            role: 'assistant' as const,
            content: "Hello! Connected via Rime speech pipeline with sub-150ms barge-in recovery. Speak or type below.",
            timestamp: new Date().toISOString(),
            isFinal: true,
            interrupted: false,
            provider: 'rime' as const,
            model: 'mistv3',
            latencyMs: 110,
            ttfbMs: 110,
            generationId: 1,
          },
        ],
      },
    }
  },
})
