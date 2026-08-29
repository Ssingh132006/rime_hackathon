# AGENTS.md

Voice-Native Frontend Starter: Next.js 16 (App Router) · Better Auth · Tailwind CSS v4 · Rime Speech Pipeline.
The rules below ensure clean parallel frontend/backend development during the hackathon.

## Commands
```bash
npm run dev            # localhost:3000 — ALWAYS port 3000 (Google OAuth callback is registered for it)
npm run build
npm run typecheck      # tsc --noEmit — run before every commit
npm run lint
```

## Hard Rules

1. **The frontend never owns a database or business routes.** No Drizzle, no Neon, no internal database code. Persistence and LLM/Rime orchestration live in the separate Python backend service.
2. **Never write raw `fetch()` in components.** Use `api.<feature>.<op>()` from `@/lib/api-client`.
3. **Every HTTP interaction must have a contract.** Define schemas in `src/contracts/<feature>.ts` with realistic deterministic `mock()` fallbacks, and register in `src/contracts/index.ts`.
4. **Monochrome grayscale styling only.** Never introduce colored design tokens (no blue links, green pills, or red badges). Use borders, weight, icons, and strike/underline.
5. **Session-gating in App Router.** Gated layouts use `await getSession(await headers())`.
6. **Visibly indicate mock data.** Always render `<MockBadge />` on pages consuming mock data so judges and developers know when mock fallbacks are active.
7. **Handle speech barge-in/interrupts cleanly.** On user interruption, flush audio playback queue immediately (measure client-side silence target <150ms) and send `user_interrupt` event to WebSocket / LiveKit data channel with monotonic `generationId`.
8. **Generation Fencing & Error Handling.** All turns and cancellation events pass `generationId` so stale tool/LLM work is discarded. All six error codes (`stt_error`, `llm_error`, `tts_error`, `provider_fallback`, `session_not_found`, `internal_error`) must be handled explicitly in UI.

## WebSocket & LiveKit Data Channel Protocol

### Client → Server Events
- `start_session`: `{ type: 'start_session', sessionId: string, voiceId?: string, protocolVersion?: 1 }`
- `audio_chunk`: `{ type: 'audio_chunk', data: string, format: 'audio/webm;codecs=opus' }`
- `text_message`: `{ type: 'text_message', content: string }`
- `user_interrupt`: `{ type: 'user_interrupt', timestamp: number (epoch_ms), generationId?: number, reason?: string }`
- `end_session`: `{ type: 'end_session', sessionId: string }`

### Server → Client Events
- `provider_status`: `{ type: 'provider_status', provider: 'rime' | 'fallback', model?: string }`
- `partial_transcript`: `{ type: 'partial_transcript', role: 'user' | 'assistant', text: string, turnId?: string, generationId?: number }`
- `final_transcript`: `{ type: 'final_transcript', role: 'user' | 'assistant', text: string, turnId: string, generationId?: number, latencyMs?: number }`
- `tts_audio_chunk`: `{ type: 'tts_audio_chunk', audioData: string, turnId: string, chunkIndex: number, isLast: boolean, generationId?: number, provider?: 'rime' | 'fallback' }`
- `state_sync`: `{ type: 'state_sync', turnId: string, generationId?: number, deliveredText: string, interrupted: boolean, ttfbMs?: number, timeToSilenceMs?: number }`
- `error`: `{ type: 'error', message: string, code?: 'stt_error' | 'llm_error' | 'tts_error' | 'provider_fallback' | 'session_not_found' | 'internal_error' }`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
