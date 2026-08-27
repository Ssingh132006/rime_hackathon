export type AudioChunkHandler = (chunk: Blob, base64: string, objectUrl: string) => void
export type VolumeHandler = (volume: number, freqData?: Uint8Array) => void

export class AudioRecorder {
  private mediaStream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private animFrameId: number | null = null
  private isRecording = false
  private recordedBlobs: Blob[] = []

  public async start(
    onChunk: AudioChunkHandler,
    onVolume?: VolumeHandler,
    timeslice = 250,
  ): Promise<void> {
    if (this.isRecording) return

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is not supported in this browser environment.')
    }

    this.recordedBlobs = []

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Web Audio API setup for volume & frequency analysis
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

      if (AudioCtx) {
        this.audioContext = new AudioCtx()
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }

        const source = this.audioContext.createMediaStreamSource(this.mediaStream)
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 256
        this.analyser.smoothingTimeConstant = 0.75
        source.connect(this.analyser)

        if (onVolume) {
          const bufferLength = this.analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)

          const updateVolume = () => {
            if (!this.isRecording || !this.analyser) return
            this.analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i]
            }
            const average = sum / bufferLength
            const normalized = Math.min(1, average / 90)
            onVolume(normalized, dataArray)
            this.animFrameId = requestAnimationFrame(updateVolume)
          }
          updateVolume()
        }
      }

      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'

      const recorder = new MediaRecorder(this.mediaStream, { mimeType })
      this.mediaRecorder = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedBlobs.push(e.data)
          const objectUrl = URL.createObjectURL(e.data)

          // Also convert to base64 for websocket transmission
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1] || ''
            onChunk(e.data, base64, objectUrl)
          }
          reader.readAsDataURL(e.data)
        }
      }

      recorder.start(timeslice)
      this.isRecording = true
    } catch (err) {
      console.error('[AudioRecorder] Failed to start recording:', err)
      await this.stop()
      throw err
    }
  }

  public stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.isRecording = false

      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId)
        this.animFrameId = null
      }

      const recorder = this.mediaRecorder

      const cleanup = () => {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop())
          this.mediaStream = null
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {})
          this.audioContext = null
        }

        this.mediaRecorder = null

        if (this.recordedBlobs.length > 0) {
          const mimeType = this.recordedBlobs[0].type || 'audio/webm'
          const combinedBlob = new Blob(this.recordedBlobs, { type: mimeType })
          resolve(combinedBlob)
        } else {
          resolve(null)
        }
      }

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          cleanup()
        }
        try {
          recorder.stop()
        } catch {
          cleanup()
        }
      } else {
        cleanup()
      }
    })
  }

  public getIsRecording(): boolean {
    return this.isRecording
  }

  public getRecordedBlobs(): Blob[] {
    return [...this.recordedBlobs]
  }
}
