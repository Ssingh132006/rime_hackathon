import { Topbar } from '@/components/shell/Topbar'
import { TranscriptView } from '@/components/history/TranscriptView'

export default async function LiveChatSessionReplayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <Topbar
        title="Session Transcript Replay"
        subtitle={`Viewing historical turns for session: ${sessionId}`}
        showProvider={true}
        provider="rime"
        showMockBadge={true}
      />
      <TranscriptView sessionId={sessionId} />
    </div>
  )
}
