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
        title: 'Quantum computing and latency discussion',
        preview: 'How does quantum entanglement affect communication latency?',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        durationSeconds: 145,
        turnCount: 6,
        provider: 'rime' as const,
      },
      {
        id: 'session_demo_2',
        title: 'Voice synthesis pronunciation test',
        preview: 'Testing phoneme articulation with Rime Mist voice...',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        durationSeconds: 84,
        turnCount: 4,
        provider: 'rime' as const,
      },
      {
        id: 'session_demo_3',
        title: 'Interruption & recovery benchmark',
        preview: 'Stop talking — can you switch topics immediately?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        durationSeconds: 210,
        turnCount: 8,
        provider: 'rime' as const,
      },
    ],
  }),
})

export const get = defineContract({
  method: 'GET',
  path: '/api/history/:sessionId',
  auth: 'user',
  summary: 'Retrieves full transcript and turn metrics for a specific past session',
  input: z.object({
    sessionId: z.string(),
  }),
  output: HistoryDetailResponseSchema,
  mock: (input) => ({
    id: input.sessionId,
    title: 'Voice Session Replay (' + input.sessionId + ')',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    provider: 'rime' as const,
    durationSeconds: 145,
    turns: [
      {
        id: 't1',
        role: 'assistant' as const,
        content: 'Welcome! How can I assist you with voice streaming today?',
        timestamp: '2026-08-27T10:00:00.000Z',
        isFinal: true,
        interrupted: false,
        latencyMs: 110,
        provider: 'rime' as const,
      },
      {
        id: 't2',
        role: 'user' as const,
        content: 'How low is the latency when using Rime TTS with audio streaming?',
        timestamp: '2026-08-27T10:00:05.000Z',
        isFinal: true,
        interrupted: false,
      },
      {
        id: 't3',
        role: 'assistant' as const,
        content: 'Rime provides ultra-low latency text-to-speech with first-chunk delivery in under 150 milliseconds.',
        timestamp: '2026-08-27T10:00:07.000Z',
        isFinal: true,
        interrupted: false,
        latencyMs: 135,
        provider: 'rime' as const,
      },
      {
        id: 't4',
        role: 'user' as const,
        content: 'Wait, stop — can you switch to explaining interruption handling?',
        timestamp: '2026-08-27T10:00:15.000Z',
        isFinal: true,
        interrupted: false,
      },
      {
        id: 't5',
        role: 'assistant' as const,
        content: 'Certainly! When you interrupt, the frontend immediately flushes the audio playback buffer and notifies the backend to cancel remaining generation.',
        timestamp: '2026-08-27T10:00:16.000Z',
        isFinal: true,
        interrupted: true,
        latencyMs: 98,
        provider: 'rime' as const,
      },
    ],
  }),
})
