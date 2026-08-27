import { Topbar } from '@/components/shell/Topbar'
import { TtsForm } from '@/components/tts/TtsForm'

export default function TextToSpeechPage() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <Topbar
        title="Text to Speech Studio"
        subtitle="Dynamic Rime voice synthesis with waveform visualization"
        showProvider={true}
        provider="rime"
        showMockBadge={true}
      />

      <div className="mx-auto max-w-5xl w-full p-8">
        <TtsForm />
      </div>
    </div>
  )
}
