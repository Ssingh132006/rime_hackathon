# Voice-Native Frontend Architecture & Research Guide (`gem.md`)

> **Repository:** [https://github.com/Ssingh132006/rime_hackathon.git](https://github.com/Ssingh132006/rime_hackathon.git)  
> **Tech Stack:** Next.js 16 (App Router, Turbopack) · Tailwind CSS v4 · Better Auth · TypeScript · WebSockets · Web Audio API · Rime Speech Pipeline  
> **Development Port:** `http://localhost:3000` (*Port 3000 is required for Google OAuth redirect registration*)

---

## 1. Executive Summary & Purpose

This workspace (`/Users/sleepy_catta/Desktop/web`) contains the complete frontend client for the **Rime Voice-Native Hackathon**. 

It provides an ultra-low latency voice conversational interface with:
1. **Gemini-Style Live Voice Chat** with real-time audio chunk streaming, live transcripts, and instant **barge-in / speech interruption recovery**.
2. **Text-to-Speech (TTS) Studio** with dynamic voice model selection (Rime catalog), pacing controls, waveform scrubbing, and direct audio download.
3. **Contract-First Architecture** with typed Zod schemas and automatic deterministic mock fallbacks, enabling 100% parallel development without blocking on the Python backend.
4. **Pure Monochrome Grayscale Design System** utilizing typography, weights, dashed/solid borders, and icons without colored design tokens.
5. **Session-Gated App Router** protected by Better Auth (Google OAuth 2.0 + SQLite local session storage + instant 1-click Judge Demo access).

---

## 2. System Architecture & Component Interaction

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                  Browser Client (:3000)                 │
                                  │                                                         │
                                  │   ┌───────────────────┐       ┌──────────────────────┐  │
                                  │   │   AudioRecorder   │       │   AudioPlayerQueue   │  │
                                  │   │  (Mic -> Opus/b64)│       │  (Gapless Audio Out) │  │
                                  │   └─────────┬─────────┘       └──────────▲───────────┘  │
                                  │             │                            │              │
                                  │             ▼                            │              │
                                  │   ┌──────────────────────────────────────┴───────────┐  │
                                  │   │           LiveChatWsClient (WebSocket)           │  │
                                  │   └────────────────────────┬─────────────────────────┘  │
                                  │                            │                            │
                                  │   ┌────────────────────────┴─────────────────────────┐  │
                                  │   │       Typed API Client (`api.<feature>.<op>`)    │  │
                                  │   └────────────────────────┬─────────────────────────┘  │
                                  └────────────────────────────┼────────────────────────────┘
                                                               │
                                         WebSocket & HTTP API (Localhost / Remote)
                                                               │
                                                               ▼
                                  ┌─────────────────────────────────────────────────────────┐
                                  │             External Python Backend (:8000)             │
                                  │                                                         │
                                  │   ┌──────────────┐   ┌─────────────┐   ┌────────────┐   │
                                  │   │ Real-time STT│──►│  LLM Agent  │──►│  Rime TTS  │   │
                                  │   └──────────────┘   └─────────────┘   └────────────┘   │
                                  └─────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure & Key Files

```
/Users/sleepy_catta/Desktop/web/
├── AGENTS.md                  # Strict developer & agent rules for the repository
├── .env.example               # Environment template for backend URLs and mock switches
├── .env.local                 # Local environment variables (Git-ignored)
├── .gitignore                 # Root ignore rules for node_modules, build artifacts, envs
├── gem.md                     # Comprehensive architecture and onboarding guide (this file)
├── package.json               # Next.js 16, Tailwind v4, Better Auth, Lucide, Zod dependencies
├── auth.sqlite                # Local SQLite database storing Better Auth user sessions
├── public/                    # Static assets & icons
└── src/
    ├── middleware.ts          # Optimistic session route protection
    ├── app/
    │   ├── layout.tsx         # Root layout with Geist font and theme provider
    │   ├── globals.css        # Monochrome grayscale CSS variables & keyframe animations
    │   ├── page.tsx           # Public landing page with feature cards & CTA
    │   ├── (auth)/
    │   │   └── sign-in/
    │   │       └── page.tsx   # Google OAuth + 1-click Demo Judge Access
    │   ├── (dashboard)/
    │   │   ├── layout.tsx     # Session-gated layout with persistent Sidebar
    │   │   ├── dashboard/
    │   │   │   └── page.tsx   # Diagnostic center & Audio Queue tester
    │   │   ├── live-chat/
    │   │   │   ├── page.tsx   # Full-height Live Voice Chat Canvas
    │   │   │   └── [sessionId]/
    │   │   │       └── page.tsx # Historical session transcript replay
    │   │   └── text-to-speech/
    │   │       └── page.tsx   # Rime TTS Studio with waveform player
    │   ├── api/
    │   │   └── auth/[...all]/ # Better Auth API route handler
    │   └── dev/
    │       └── api/page.tsx   # Interactive contract & schema explorer (/dev/api)
    ├── components/
    │   ├── chat/
    │   │   ├── ChatCanvas.tsx       # Gemini-style interactive chat stream
    │   │   ├── MessageBubble.tsx    # Speech bubble with latency & interrupt badges
    │   │   ├── VoiceInputButton.tsx # Animated mic button with audio volume waves
    │   │   ├── VoiceTester.tsx      # Browser mic & audio queue diagnostics lab
    │   │   ├── LatencyBadge.tsx     # Latency counter component (e.g. 120ms)
    │   │   └── ProviderBadge.tsx    # Status badge (Speech: Rime / Fallback)
    │   ├── history/
    │   │   ├── HistoryList.tsx      # Sidebar past sessions list
    │   │   └── TranscriptView.tsx   # Detailed turn-by-turn replay component
    │   ├── shell/
    │   │   ├── Sidebar.tsx          # Collapsible navigation & session history
    │   │   ├── Topbar.tsx           # Page header with breadcrumbs & provider badge
    │   │   └── ThemeToggle.tsx      # Pure grayscale light/dark mode switch
    │   ├── tts/
    │   │   ├── TtsForm.tsx          # Synthesis text prompt form & pacing slider
    │   │   ├── VoicePicker.tsx      # Dynamic Rime voice selection cards
    │   │   └── AudioPlayer.tsx      # Waveform scrub bar with download button
    │   ├── common/
    │   │   ├── MockBadge.tsx        # Required indicator showing mock vs live status
    │   │   ├── EmptyState.tsx       # Grayscale empty state placeholder
    │   │   └── ErrorState.tsx       # Resilient retry alert box
    │   └── ui/                      # Base UI primitives (button, input, textarea, etc.)
    ├── contracts/                   # Contract-first schemas & mock generators
    │   ├── _kit.ts                  # `defineContract` helper and type definitions
    │   ├── index.ts                 # Registry bundling tts, chat, and history
    │   ├── chat.ts                  # Live chat sessions & WebSocket event schemas
    │   ├── history.ts               # Session list & transcript detail schemas
    │   └── tts.ts                   # Voice catalog & speech generation schemas
    ├── hooks/
    │   ├── useLiveChatSession.ts    # Central hook managing WebSockets, mic, and player
    │   └── useTheme.ts              # LocalStorage + system theme hook
    └── lib/
        ├── api-client.ts            # Type-safe API client (`api.<feature>.<op>()`)
        ├── auth.ts                  # Server-side Better Auth initialization + SQLite
        ├── auth-client.ts           # Client-side auth helpers (`signInWithGoogle`, `signInAsGuest`)
        ├── utils.ts                 # `cn()` clsx/twMerge utility
        ├── ws-client.ts             # `LiveChatWsClient` WebSocket wrapper
        └── audio/
            ├── player-queue.ts      # Gapless audio queue with instant interrupt flush
            └── recorder.ts          # Web Audio API microphone stream & volume meter
```

---

## 4. WebSocket Event Protocol Specification

The live chat layer communicates over bidirectional WebSockets via [src/lib/ws-client.ts](file:///Users/sleepy_catta/Desktop/web/src/lib/ws-client.ts) using schemas defined in [src/contracts/chat.ts](file:///Users/sleepy_catta/Desktop/web/src/contracts/chat.ts).

### Client → Server Events

| Event Type | Payload Schema | Description |
| :--- | :--- | :--- |
| `start_session` | `{ type: 'start_session', sessionId: string, voiceId?: string }` | Opens a conversation session and sets voice model. |
| `audio_chunk` | `{ type: 'audio_chunk', data: string, format: 'audio/webm;codecs=opus' }` | Streams base64-encoded microphone audio chunks every 250ms. |
| `text_message` | `{ type: 'text_message', content: string }` | Sends typed user prompts. |
| `user_interrupt` | `{ type: 'user_interrupt', timestamp: number, reason?: string }` | Barge-in trigger: immediately halts server TTS generation. |
| `end_session` | `{ type: 'end_session', sessionId: string }` | Gracefully closes the voice stream. |

### Server → Client Events

| Event Type | Payload Schema | Description |
| :--- | :--- | :--- |
| `provider_status`| `{ type: 'provider_status', provider: 'rime' \| 'fallback', reason?: string }` | Emits active speech provider status. |
| `partial_transcript` | `{ type: 'partial_transcript', role: 'user' \| 'assistant', text: string, turnId?: string }` | Streaming words for real-time speech bubble display. |
| `final_transcript` | `{ type: 'final_transcript', role: 'user' \| 'assistant', text: string, turnId: string, latencyMs?: number }` | Completed turn transcript with latency benchmark. |
| `tts_audio_chunk` | `{ type: 'tts_audio_chunk', audioData: string, turnId: string, chunkIndex: number, isLast: boolean, provider?: 'rime' \| 'fallback' }` | Base64 MP3 or URL audio chunk fed to the playback queue. |
| `state_sync` | `{ type: 'state_sync', turnId: string, deliveredText: string, interrupted: boolean }` | Synchronizes text state when interruption cuts off generation. |
| `error` | `{ type: 'error', message: string, code?: string }` | Server-side execution or pipeline error alert. |

---

## 5. Audio Pipeline & Barge-In Mechanics

### Microphone Capture ([recorder.ts](file:///Users/sleepy_catta/Desktop/web/src/lib/audio/recorder.ts))
- Uses `navigator.mediaDevices.getUserMedia` with `echoCancellation`, `noiseSuppression`, and `autoGainControl`.
- Extracts real-time volume frequency data via `AnalyserNode` to render the live equalizer bars in [VoiceInputButton.tsx](file:///Users/sleepy_catta/Desktop/web/src/components/chat/VoiceInputButton.tsx) and [VoiceTester.tsx](file:///Users/sleepy_catta/Desktop/web/src/components/chat/VoiceTester.tsx).
- Emits chunks via `MediaRecorder` at 250ms timeslices, encoding as base64 Opus data.

### Playback Queue ([player-queue.ts](file:///Users/sleepy_catta/Desktop/web/src/lib/audio/player-queue.ts))
- FIFO queue for continuous streamed chunks from Rime TTS.
- Automatically handles `data:audio/mp3;base64`, `blob:`, or standard `http` audio URLs.
- Executes `onended` chain to ensure gapless streaming.

### Instant Interruption / Barge-in
When a user speaks while the assistant is talking:
1. `AudioPlayerQueue.interrupt()` immediately calls `.pause()`, `.currentTime = 0`, drops `.src`, and clears all pending queue items.
2. The UI sets `interrupted: true` on the active speech bubble, displaying the `INTERRUPTED` badge.
3. A `user_interrupt` payload is dispatched through the WebSocket so the backend Python service aborts LLM token streaming and Rime TTS chunk synthesis.

---

## 6. HTTP API Contracts & Mock Fallback Layer

Never use raw `fetch()` in components. Use `api.<feature>.<op>()` from [src/lib/api-client.ts](file:///Users/sleepy_catta/Desktop/web/src/lib/api-client.ts).

### Registered Contracts

1. **TTS Feature (`api.tts`)**:
   - `api.tts.voices()`: `GET /api/tts/voices` → Returns active voice models (`rime-mist`, `rime-ember`, `rime-celeste`, `rime-atlas`).
   - `api.tts.generate({ text, voiceId, speed, reduceLatency })`: `POST /api/tts/generate` → Synthesizes speech with duration and latency metrics.

2. **History Feature (`api.history`)**:
   - `api.history.list({ limit, cursor })`: `GET /api/history` → Paginated list of past recorded chat sessions.
   - `api.history.get({ sessionId })`: `GET /api/history/:sessionId` → Full turn-by-turn transcript with turn latency.

3. **Chat Session Feature (`api.chat`)**:
   - `api.chat.createSession({ voiceId, promptOverride })`: `POST /api/chat/session` → Initializes backend session and returns WebSocket URL.

### Mock Fallback Mechanism
- If `NEXT_PUBLIC_USE_MOCKS=true` or if the external Python backend is unreachable, the client invokes `contract.mock(input)` seamlessly.
- Every page rendering mock data automatically mounts `<MockBadge source="mock" />` so judges and developers know the source.
- You can force mock mode via URL parameter `?__mock=1` or force live mode via `?__mock=0`.
- All schemas and mock payloads can be inspected live at `http://localhost:3000/dev/api`.

---

## 7. Environment Variables Configuration

In `.env.local` (and template in `.env.example`):

```bash
# --- External Python Backend ---
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# --- Google OAuth (Better Auth) ---
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BETTER_AUTH_SECRET=your-better-auth-secret-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3000

# --- Mock Mode Switch ---
NEXT_PUBLIC_USE_MOCKS=true
MOCK_DELAY_MS=250
```

> **Note:** Never add Rime API keys or LLM private keys to the frontend `.env.local`. All proprietary keys reside solely in the teammate's Python backend environment.

---

## 8. Developer Commands & Workflow

```bash
# Run local dev server (Always port 3000)
npm run dev

# TypeScript typechecking (tsc --noEmit)
npm run typecheck

# Code linting
npm run lint

# Production build test
npm run build
```

---

## 9. Design System Guidelines (Monochrome Grayscale)

- **Palette:** Pure grayscale HSL / hex tokens (`--background: #ffffff`, `--foreground: #09090b`, `--muted: #1e1e24`, `--border: #27272a`).
- **Forbidden:** No colored design tokens (no blue links, green status dots, red error pills).
- **Affordance & State:** Communicated exclusively using borders (solid, dashed), typography weights (semibold, bold), line-through/underline, and icons from `lucide-react`.

---

## 10. Next Steps for Backend Integration & Research

When connecting to the teammate's Python FastAPI backend:
1. **Launch Python Server:** Ensure the FastAPI server is running on `http://localhost:8000`.
2. **Implement WebSocket Endpoint:** Expose `ws://localhost:8000/ws/{sessionId}` handling the events defined in Section 4.
3. **Expose REST Endpoints:**
   - `GET /api/tts/voices`
   - `POST /api/tts/generate`
   - `GET /api/history`
   - `GET /api/history/{sessionId}`
   - `POST /api/chat/session`
4. **Switch to Live Mode:** In `.env.local`, set `NEXT_PUBLIC_USE_MOCKS=false` and restart Next.js dev server (`npm run dev`).
5. **Verify Latency:** Benchmark `latencyMs` in `<LatencyBadge>` to ensure Rime first-chunk delivery is under 150ms.
