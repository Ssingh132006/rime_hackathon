import Link from 'next/link'
import { headers } from 'next/headers'
import { Mic, Volume2, Sparkles, Activity, ArrowRight, Zap } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { Topbar } from '@/components/shell/Topbar'
import { Button } from '@/components/ui/button'
import { VoiceTester } from '@/components/chat/VoiceTester'

export default async function DashboardPage() {
  const reqHeaders = await headers()
  const session = await getSession(reqHeaders)

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <Topbar
        title="Dashboard"
        subtitle="Voice interface controls and streaming diagnostics"
        showMockBadge={true}
      />

      <div className="mx-auto max-w-5xl w-full p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {session?.user?.name || 'Judge'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Voice-Native App frontend connected to the Rime speech synthesis pipeline.
          </p>
        </div>

        {/* Quick Launch Action Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Live Chat Card */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs hover:border-foreground transition-all">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background font-mono">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Live Voice Chat
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Real-time two-way voice streaming over WebSockets with instant barge-in / interruption handling.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button variant="default" size="sm" asChild className="w-full text-xs font-mono">
                <Link href="/live-chat">
                  Start Live Session <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Text-to-Speech Studio Card */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs hover:border-foreground transition-all">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary border border-border text-foreground font-mono">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Text to Speech Studio
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Generate speech using the dynamic Rime voice catalog with waveform playback and audio download.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button variant="outline" size="sm" asChild className="w-full text-xs font-mono">
                <Link href="/text-to-speech">
                  Open TTS Studio <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Testing & Audio Queue Lab */}
        <VoiceTester />

        {/* System & Benchmark Telemetry */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System &amp; Provider Status
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-mono uppercase">Speech Engine</span>
                <Sparkles className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="text-sm font-semibold text-foreground">Rime TTS (Active)</div>
              <div className="text-[11px] text-muted-foreground">Dynamic catalog synchronization</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-mono uppercase">Target Latency</span>
                <Zap className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="text-sm font-semibold text-foreground">&lt; 150 ms</div>
              <div className="text-[11px] text-muted-foreground">Sub-second turnaround on voice turns</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-mono uppercase">Interruption</span>
                <Activity className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="text-sm font-semibold text-foreground">Immediate Flush</div>
              <div className="text-[11px] text-muted-foreground">Queue cancellation on user voice barge-in</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
