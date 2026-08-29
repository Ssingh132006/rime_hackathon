import { z } from 'zod'
import { defineContract } from './_kit'
import { ChatTurnSchema } from './chat'

export const HistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  preview: z.string(),
  createdAt: z.string(),
  durationSeconds: z.number(),
  turnCount: z.number(),
  provider: z.enum(['rime', 'fallback']).default('rime'),
  model: z.string().default('mistv3'),
})
export type HistoryItem = z.infer<typeof HistoryItemSchema>

export const HistoryListResponseSchema = z.object({
  sessions: z.array(HistoryItemSchema),
  nextCursor: z.string().optional(),
})

export const HistoryDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  provider: z.enum(['rime', 'fallback']),
  model: z.string().default('mistv3'),
  durationSeconds: z.number(),
  turns: z.array(ChatTurnSchema),
})
export type HistoryDetailResponse = z.infer<typeof HistoryDetailResponseSchema>

export const list = defineContract({
  method: 'GET',
  path: '/api/history',
  auth: 'user',
  summary: 'Fetches paginated list of past voice chat sessions',
  input: z.object({
    limit: z.coerce.number().optional().default(20),
    cursor: z.string().optional(),
  }),
  output: HistoryListResponseSchema,
  mock: () => ({
    sessions: [
      {
        id: 'session_demo_1',
        title: 'Interruption & recovery acceptance stress test',
        preview: 'Stop talking — can you switch to next Tuesday instead?',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        durationSeconds: 145,
        turnCount: 5,
        provider: 'rime' as const,
        model: 'mistv3 / coda',
      },
      {
        id: 'session_demo_2',
        title: 'Quantum computing and latency discussion',
        preview: 'How does quantum entanglement affect communication latency?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        durationSeconds: 84,
        turnCount: 4,
        provider: 'rime' as const,
        model: 'mistv3',
      },
      {
        id: 'session_demo_3',
        title: 'Voice synthesis phoneme pronunciation test',
        preview: 'Testing phoneme articulation with Rime Mist voice...',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        durationSeconds: 210,
        turnCount: 8,
        provider: 'rime' as const,
        model: 'mistv3',
      },
    ],
  }),
})

export const get = defineContract({
  method: 'GET',
  path: '/api/history/:sessionId',
  auth: 'user',
  summary: 'Retrieves full transcript and turn metrics for a specific past session with deliveredText for cut-off turns',
  input: z.object({
    sessionId: z.string(),
  }),
  output: HistoryDetailResponseSchema,
  mock: (input) => ({
    id: input.sessionId,
    title: 'Voice Session Replay (' + input.sessionId + ')',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    provider: 'rime' as const,
    model: 'mistv3 / coda',
    durationSeconds: 145,
    turns: [
      {
        id: 't1',
        generationId: 1,
        role: 'assistant' as const,
        content: 'Welcome! How can I assist you with voice streaming and tool orchestration today?',
        timestamp: '2026-08-29T10:00:00.000Z',
        isFinal: true,
        interrupted: false,
        latencyMs: 110,
        ttfbMs: 105,
        provider: 'rime' as const,
        model: 'mistv3',
      },
      {
        id: 't2',
        generationId: 2,
        role: 'user' as const,
        content: 'Can you look up my order status for booking #8492?',
        timestamp: '2026-08-29T10:00:05.000Z',
        isFinal: true,
        interrupted: false,
      },
      {
        id: 't3',
        generationId: 3,
        role: 'assistant' as const,
        content: 'Looking that up for you right now... Booking #8492 is currently scheduled for delivery on Monday morning at 9:00 AM at the central—',
        deliveredText: 'Looking that up for you right now... Booking #8492 is currently scheduled for delivery on Monday morning at 9:00 AM at the central—',
        timestamp: '2026-08-29T10:00:08.000Z',
        isFinal: true,
        interrupted: true,
        latencyMs: 125,
        ttfbMs: 118,
        timeToSilenceMs: 82,
        provider: 'rime' as const,
        model: 'mistv3 / coda',
      },
      {
        id: 't4',
        generationId: 4,
        role: 'user' as const,
        content: 'Wait, stop! Actually make that for next Tuesday instead.',
        timestamp: '2026-08-29T10:00:11.000Z',
        isFinal: true,
        interrupted: false,
      },
      {
        id: 't5',
        generationId: 5,
        role: 'assistant' as const,
        content: 'Understood. I have discarded the previous lookup and rescheduled delivery #8492 to next Tuesday at 9:00 AM.',
        timestamp: '2026-08-29T10:00:13.000Z',
        isFinal: true,
        interrupted: false,
        latencyMs: 98,
        ttfbMs: 92,
        provider: 'rime' as const,
        model: 'mistv3 / coda',
      },
    ],
  }),
})

export const getTranscript = defineContract({
  method: 'GET',
  path: '/api/sessions/:sessionId/transcript',
  auth: 'user',
  summary: 'Endpoint backing session transcript replay with verified deliveredText for interrupted turns',
  input: z.object({
    sessionId: z.string(),
  }),
  output: HistoryDetailResponseSchema,
  mock: (input) => get.mock(input),
})
