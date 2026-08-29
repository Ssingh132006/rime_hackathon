import { z } from 'zod'
import { defineContract } from './_kit'

export const ErrorCodeEnum = z.enum([
  'stt_error',
  'llm_error',
  'tts_error',
  'provider_fallback',
  'session_not_found',
  'internal_error',
])
export type ErrorCode = z.infer<typeof ErrorCodeEnum>

export const GenerationFenceSchema = z.object({
  generationId: z.number(),
  turnId: z.string(),
  cancelReason: z.string().optional(),
  interruptedAtEpochMs: z.number(),
  timeToSilenceMs: z.number().optional(),
})
export type GenerationFence = z.infer<typeof GenerationFenceSchema>

export const CriterionResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  description: z.string(),
  metric: z.string(),
})
export type CriterionResult = z.infer<typeof CriterionResultSchema>

export const StressTestResultSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  passed: z.boolean(),
  provider: z.enum(['rime', 'fallback']).default('rime'),
  model: z.string().default('mistv3 / coda'),
  criteria: z.object({
    audioStopWithinThreshold: z.object({
      name: z.string().default('Audio Stop < 150ms'),
      passed: z.boolean(),
      timeToSilenceMs: z.number(),
      thresholdMs: z.number().default(150),
      measuredClientSide: z.boolean().default(true),
    }),
    staleWorkDiscarded: z.object({
      name: z.string().default('Stale Work Discarded (Generation Fencing)'),
      passed: z.boolean(),
      oldGenerationId: z.number(),
      activeGenerationId: z.number(),
      staleSpoken: z.boolean().default(false),
    }),
    newRequestAnswered: z.object({
      name: z.string().default('Conversation Continuity'),
      passed: z.boolean(),
      prompt: z.string(),
      finalResponsePreview: z.string(),
    }),
    transcriptAccuracy: z.object({
      name: z.string().default('Accurate Delivered Transcript (No Ghosts)'),
      passed: z.boolean(),
      deliveredTextMatchesAudio: z.boolean(),
      ghostTurnsCount: z.number().default(0),
    }),
  }),
  latencyMetrics: z.object({
    ttfbMs: z.number(),
    ttfaMs: z.number(),
    timeToSilenceMs: z.number(),
    interruptionJitterMs: z.number(),
  }),
})
export type StressTestResult = z.infer<typeof StressTestResultSchema>

export const HealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'offline']),
  provider: z.enum(['rime', 'fallback']).default('rime'),
  model: z.string().default('mistv3'),
  livekitReady: z.boolean().default(true),
  uptimeSeconds: z.number(),
  activeSessionsCount: z.number().default(1),
})
export type HealthStatus = z.infer<typeof HealthStatusSchema>

// Contracts
export const getHealth = defineContract({
  method: 'GET',
  path: '/api/health',
  auth: 'public',
  summary: 'Reports service health, active speech provider, and LiveKit status',
  input: z.object({}),
  output: HealthStatusSchema,
  mock: () => ({
    status: 'ok' as const,
    provider: 'rime' as const,
    model: 'mistv3 / coda',
    livekitReady: true,
    uptimeSeconds: 3840,
    activeSessionsCount: 3,
  }),
})

export const getLatestEvidence = defineContract({
  method: 'GET',
  path: '/api/evidence/latest',
  auth: 'public',
  summary: 'Fetches the latest automated interruption stress test fixture results',
  input: z.object({}),
  output: StressTestResultSchema,
  mock: () => ({
    id: 'evidence_' + Date.now(),
    timestamp: new Date().toISOString(),
    passed: true,
    provider: 'rime' as const,
    model: 'coda / mistv3',
    criteria: {
      audioStopWithinThreshold: {
        name: 'Audio Stop < 150ms',
        passed: true,
        timeToSilenceMs: 88,
        thresholdMs: 150,
        measuredClientSide: true,
      },
      staleWorkDiscarded: {
        name: 'Stale Work Discarded (Generation Fencing)',
        passed: true,
        oldGenerationId: 4,
        activeGenerationId: 5,
        staleSpoken: false,
      },
      newRequestAnswered: {
        name: 'Conversation Continuity',
        passed: true,
        prompt: 'Actually, make that for next Tuesday instead.',
        finalResponsePreview: 'Understood. Rescheduling to next Tuesday at 2:00 PM.',
      },
      transcriptAccuracy: {
        name: 'Accurate Delivered Transcript (No Ghosts)',
        passed: true,
        deliveredTextMatchesAudio: true,
        ghostTurnsCount: 0,
      },
    },
    latencyMetrics: {
      ttfbMs: 114,
      ttfaMs: 132,
      timeToSilenceMs: 88,
      interruptionJitterMs: 12,
    },
  }),
})

export const triggerStress = defineContract({
  method: 'POST',
  path: '/api/test/stress',
  auth: 'user',
  summary: 'Triggers simulated deliberate backend tool delay to test barge-in fencing',
  input: z.object({
    simulatedDelayMs: z.number().default(3000),
    query: z.string().optional(),
  }),
  output: z.object({
    queued: z.boolean(),
    generationId: z.number(),
    simulatedDelayMs: z.number(),
    instructions: z.string(),
  }),
  mock: (input) => ({
    queued: true,
    generationId: Date.now(),
    simulatedDelayMs: input.simulatedDelayMs ?? 3000,
    instructions: 'Injecting 3s simulated tool latency. Barge in mid-wait or mid-speech to test cancellation.',
  }),
})
