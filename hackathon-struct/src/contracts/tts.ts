import { z } from 'zod'
import { defineContract } from './_kit'

export const VoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  language: z.string().default('en-US'),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  sampleAudioUrl: z.string().optional(),
  provider: z.enum(['rime', 'fallback']).default('rime'),
})
export type Voice = z.infer<typeof VoiceSchema>

export const VoicesResponseSchema = z.object({
  voices: z.array(VoiceSchema),
  provider: z.enum(['rime', 'fallback']),
})

export const GenerateTtsInputSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(2000, 'Text exceeds 2000 characters limit'),
  voiceId: z.string().min(1, 'Voice must be selected'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  reduceLatency: z.boolean().default(true),
})
export type GenerateTtsInput = z.infer<typeof GenerateTtsInputSchema>

export const GenerateTtsResponseSchema = z.object({
  audioUrl: z.string(),
  durationSeconds: z.number(),
  latencyMs: z.number(),
  provider: z.enum(['rime', 'fallback']),
  voiceId: z.string(),
  characterCount: z.number(),
})
export type GenerateTtsResponse = z.infer<typeof GenerateTtsResponseSchema>

export const voices = defineContract({
  method: 'GET',
  path: '/api/tts/voices',
  auth: 'public',
  summary: 'Fetches active dynamic voice catalog from the speech provider (Rime)',
  input: z.object({}),
  output: VoicesResponseSchema,
  mock: () => ({
    provider: 'rime' as const,
    voices: [
      {
        id: 'rime-mist',
        name: 'Mist (Warm / Conversational)',
        description: 'Ultra-low latency conversational voice with natural pacing',
        language: 'en-US',
        gender: 'female' as const,
        provider: 'rime' as const,
      },
      {
        id: 'rime-ember',
        name: 'Ember (Crisp / Articulate)',
        description: 'High intelligibility voice, optimized for rapid back-and-forth',
        language: 'en-US',
        gender: 'male' as const,
        provider: 'rime' as const,
      },
      {
        id: 'rime-celeste',
        name: 'Celeste (Expressive / Dynamic)',
        description: 'Rich intonation handling with low pronunciation variance',
        language: 'en-US',
        gender: 'female' as const,
        provider: 'rime' as const,
      },
      {
        id: 'rime-atlas',
        name: 'Atlas (Deep / Authoritative)',
        description: 'Resonant tone with reliable phoneme accuracy',
        language: 'en-US',
        gender: 'male' as const,
        provider: 'rime' as const,
      },
    ],
  }),
})

export const generate = defineContract({
  method: 'POST',
  path: '/api/tts/generate',
  auth: 'user',
  summary: 'Generates speech audio from input text using Rime TTS',
  input: GenerateTtsInputSchema,
  output: GenerateTtsResponseSchema,
  mock: (input) => ({
    audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg',
    durationSeconds: Math.max(1.2, Number((input.text.length * 0.06).toFixed(1))),
    latencyMs: 142,
    provider: 'rime' as const,
    voiceId: input.voiceId,
    characterCount: input.text.length,
  }),
})
