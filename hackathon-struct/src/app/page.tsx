import Link from 'next/link'
import { AudioWaveform, ArrowRight, Mic, Volume2, Sparkles, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProviderBadge } from '@/components/chat/ProviderBadge'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-mono font-bold">
            <AudioWaveform className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Voice-Native App
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ProviderBadge provider="rime" />
          <Button variant="default" size="sm" asChild className="text-xs font-mono">
            <Link href="/sign-in">
              Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-mono text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
            <span>Rime Hackathon · Voice Architecture</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Ultra-Low Latency Voice Intelligence
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Contract-first voice interface featuring real-time conversational streaming,
            sub-150ms speech synthesis with Rime, and visible interruption handling.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
            <Button variant="default" size="lg" asChild className="w-full sm:w-auto text-xs font-mono">
              <Link href="/live-chat">
                <Mic className="h-4 w-4 mr-1.5" />
                Launch Live Chat
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto text-xs font-mono">
              <Link href="/text-to-speech">
                <Volume2 className="h-4 w-4 mr-1.5" />
                Text-to-Speech Studio
              </Link>
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 gap-4 pt-12 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                <Mic className="h-3.5 w-3.5" />
                <span>Live Streaming</span>
              </div>
              <p className="text-xs text-muted-foreground">
                WebSocket audio chunking and real-time partial/final transcript synchronization.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Rime Provider</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Dynamic voice catalog integration with conversational speed and intonation controls.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                <Terminal className="h-3.5 w-3.5" />
                <span>Interruption Recovery</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Instant audio buffer cancellation and state reconciliation on barge-in.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs font-mono text-muted-foreground">
        Monochrome UI · Next.js 16 + Tailwind CSS v4 · Rime Hackathon
      </footer>
    </div>
  )
}
