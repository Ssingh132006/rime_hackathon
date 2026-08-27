export type PlaybackStateListener = (isPlaying: boolean) => void
export type ChunkPlayedListener = (chunkIndex: number, remaining: number) => void

export class AudioPlayerQueue {
  private queue: string[] = []
  private isPlaying = false
  private currentAudio: HTMLAudioElement | null = null
  private chunkIndex = 0
  private onPlaybackStateChange?: PlaybackStateListener
  private onChunkPlayed?: ChunkPlayedListener

  constructor(
    onPlaybackStateChange?: PlaybackStateListener,
    onChunkPlayed?: ChunkPlayedListener,
  ) {
    this.onPlaybackStateChange = onPlaybackStateChange
    this.onChunkPlayed = onChunkPlayed
  }

  /**
   * Enqueue an audio source (Blob URL, base64 data URI, or audio URL).
   */
  public enqueue(audioBase64OrUrl: string): void {
    const src =
      audioBase64OrUrl.startsWith('http') ||
      audioBase64OrUrl.startsWith('data:') ||
      audioBase64OrUrl.startsWith('blob:')
        ? audioBase64OrUrl
        : `data:audio/mp3;base64,${audioBase64OrUrl}`

    this.queue.push(src)

    if (!this.isPlaying) {
      this.playNext()
    }
  }

  /**
   * Immediately halts active audio and empties the upcoming chunk queue.
   */
  public interrupt(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio.removeAttribute('src')
      this.currentAudio.load()
      this.currentAudio = null
    }

    this.queue = []
    this.isPlaying = false
    this.chunkIndex = 0
    this.onPlaybackStateChange?.(false)
  }

  public clearQueue(): void {
    this.queue = []
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false
      this.currentAudio = null
      this.chunkIndex = 0
      this.onPlaybackStateChange?.(false)
      return
    }

    this.isPlaying = true
    this.onPlaybackStateChange?.(true)

    const nextSrc = this.queue.shift()!
    const audio = new Audio()
    this.currentAudio = audio
    audio.src = nextSrc
    audio.preload = 'auto'

    this.chunkIndex++
    this.onChunkPlayed?.(this.chunkIndex, this.queue.length)

    audio.onended = () => {
      this.playNext()
    }

    audio.onerror = (err) => {
      console.warn('[AudioPlayerQueue] Playback issue on current item, moving to next:', err)
      this.playNext()
    }

    audio.play().catch((err) => {
      console.warn('[AudioPlayerQueue] Audio play prevented:', err)
      this.playNext()
    })
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public getQueueLength(): number {
    return this.queue.length
  }
}
