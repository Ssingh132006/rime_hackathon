import { Topbar } from '@/components/shell/Topbar'
import { ChatCanvas } from '@/components/chat/ChatCanvas'

export default function LiveChatPage() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <Topbar
        title="Live Voice Chat"
        subtitle="Real-time conversational streaming and interruption testing"
        showProvider={true}
        provider="rime"
        showMockBadge={true}
      />
      <ChatCanvas />
    </div>
  )
}
