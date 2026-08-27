import { z } from 'zod'
import { defineContract } from './_kit'

export const ChatTurnSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  isFinal: z.boolean().default(true),
  interrupted: z.boolean().default(false),
  latencyMs: z.number().optional(),
  provider: z.enum(['rime', 'fallback']).optional(),
  audioUrl: z.string().optional(),
})
export type ChatTurn = z.infer<typeof ChatTurnSchema>

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  status: z.enum(['active', 'ended', 'interrupted']),
  provider: z.enum(['rime', 'fallback']),
  createdAt: z.string(),
  turns: z.array(ChatTurnSchema),
})
export type ChatSession = z.infer<typeof ChatSessionSchema>

export const CreateSessionInputSchema = z.object({
  voiceId: z.string().optional().default('rime-mist'),
  promptOverride: z.string().optional(),
})

export const CreateSessionResponseSchema = z.object({
  session: ChatSessionSchema,
  wsUrl: z.string(),
})

// WebSocket Message Schemas
export const WsClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('start_session'),
    sessionId: z.string(),
    voiceId: z.string().optional(),
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
    timestamp: z.number(),
    reason: z.string().optional(),
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
  }),
  z.object({
    type: z.literal('final_transcript'),
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    turnId: z.string(),
    latencyMs: z.number().optional(),
  }),
  z.object({
    type: z.literal('tts_audio_chunk'),
    audioData: z.string(),
    turnId: z.string(),
    chunkIndex: z.number(),
    isLast: z.boolean(),
    provider: z.enum(['rime', 'fallback']).default('rime'),
  }),
  z.object({
    type: z.literal('provider_status'),
    provider: z.enum(['rime', 'fallback']),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('state_sync'),
    turnId: z.string(),
    deliveredText: z.string(),
    interrupted: z.boolean(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
    code: z.string().optional(),
  }),
])
export type WsServerEvent = z.infer<typeof WsServerEventSchema>

export const createSession = defineContract({
  method: 'POST',
  path: '/api/chat/session',
  auth: 'user',
  summary: 'Initializes a new real-time voice chat session with the Python backend',
  input: CreateSessionInputSchema,
  output: CreateSessionResponseSchema,
  mock: (input) => {
    const id = `session_${Date.now()}`
    return {
      session: {
        id,
        userId: 'user_demo',
        title: 'Voice Session ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active' as const,
        provider: 'rime' as const,
        createdAt: new Date().toISOString(),
        turns: [
          {
            id: 'turn_0',
            role: 'assistant' as const,
            content: "Hello! I'm connected and listening via Rime speech synthesis. How can I help you today?",
            timestamp: new Date().toISOString(),
            isFinal: true,
            interrupted: false,
            provider: 'rime' as const,
            latencyMs: 120,
          },
        ],
      },
      wsUrl: `ws://localhost:8000/ws/${id}`,
    }
  },
})
