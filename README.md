# Voice-Native App Frontend (Rime Hackathon)

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Better Auth · Rime Voice Pipeline.

This repository contains the **frontend-only** application for the Rime Voice Hackathon. The speech recognition, LLM orchestration, Rime TTS integration, and persistence reside in the external Python backend service. The frontend communicates with the Python service over HTTP (`NEXT_PUBLIC_API_BASE_URL`) and WebSocket (`NEXT_PUBLIC_WS_BASE_URL`).

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start local development server (Port 3000)
npm run dev
```

Open <http://localhost:3000> to access the application, or <http://localhost:3000/dev/api> to view the contract registry.

---

## Features & Pages

1. **Google Sign-In** (`/sign-in`): Minimal Google authentication.
2. **Dashboard** (`/dashboard`): Landing overview with status readouts and quick links into Live Chat and TTS Studio.
3. **Live Voice Chat** (`/live-chat`): Real-time two-way voice streaming over WebSockets, centered Gemini-style interface, mic waveform input, and immediate interruption/barge-in recovery.
4. **Session Replay** (`/live-chat/[sessionId]`): Detailed turn transcript replay with latency badges and speaker markers.
5. **Text-to-Speech Studio** (`/text-to-speech`): Pacing controls and speech synthesis fed dynamically by the backend's Rime voice catalog, complete with waveform audio playback and download.
6. **API Contracts Explorer** (`/dev/api`): Contract-first inspector displaying schemas and mock/live statuses.

---

## Design System (Monochrome Only)

- Strict grayscale palette: pure black, pure white, and 4-6 shades of gray.
- Zero colored pills or buttons (no blue links, no green success, no red error) — status is conveyed through weight, borders, icons, and underline/strike.
- Working light/dark mode toggle persisted in `localStorage`.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of external Python backend | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_BASE_URL` | WebSocket URL of external Python backend | `ws://localhost:8000` |
| `NEXT_PUBLIC_USE_MOCKS` | Enables client-side mock fallback | `true` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional in dev |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Optional in dev |
| `BETTER_AUTH_SECRET` | Auth signing secret | Dev default |
| `BETTER_AUTH_URL` | Frontend origin | `http://localhost:3000` |

---

## Scripts

```bash
npm run dev        # Starts Next.js dev server on port 3000
npm run typecheck  # Validates TypeScript types (tsc --noEmit)
npm run build      # Builds production bundle
npm run lint       # Runs ESLint
```
