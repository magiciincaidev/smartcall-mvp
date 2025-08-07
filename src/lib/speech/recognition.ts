import { supabase } from '@/lib/supabase/client'

export interface TranscriptionResult {
  text: string
  confidence: number
  isFinal: boolean
  speaker: 'customer' | 'operator'
}

export interface SpeechRecognitionConfig {
  sessionId: string
  language?: string
  interimResults?: boolean
  continuous?: boolean
}

export class SpeechRecognitionService {
  private recognition: any = null
  private isListening = false
  private sessionId: string
  private onTranscription?: (result: TranscriptionResult) => void
  private language: string

  constructor(config: SpeechRecognitionConfig) {
    this.sessionId = config.sessionId
    this.language = config.language || 'ja-JP'
    
    // Check for browser support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition(config)
      }
    }
  }

  private setupRecognition(config: SpeechRecognitionConfig) {
    if (!this.recognition) return

    this.recognition.continuous = config.continuous ?? true
    this.recognition.interimResults = config.interimResults ?? true
    this.recognition.lang = this.language
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      console.log('Speech recognition started')
      this.isListening = true
    }

    this.recognition.onend = () => {
      console.log('Speech recognition ended')
      this.isListening = false
      
      // Restart if it was stopped unexpectedly
      if (this.shouldRestart()) {
        setTimeout(() => this.start(), 100)
      }
    }

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0.5
        const isFinal = result.isFinal

        const transcriptionResult: TranscriptionResult = {
          text: transcript,
          confidence,
          isFinal,
          speaker: 'customer' // Default to customer, can be updated with speaker diarization
        }

        // Call callback
        if (this.onTranscription) {
          this.onTranscription(transcriptionResult)
        }

        // Save to database if final
        if (isFinal) {
          this.saveTranscription(transcriptionResult)
        } else {
          // Broadcast interim results
          this.broadcastInterimResult(transcriptionResult)
        }
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      if (event.error === 'not-allowed') {
        alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
      }
    }
  }

  private shouldRestart(): boolean {
    // Only restart if we were intentionally listening
    return this.isListening
  }

  async start(onTranscription?: (result: TranscriptionResult) => void): Promise<boolean> {
    if (!this.recognition) {
      console.error('Speech recognition not supported')
      return false
    }

    if (this.isListening) {
      console.warn('Speech recognition is already running')
      return true
    }

    this.onTranscription = onTranscription

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      return false
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false
      this.recognition.stop()
    }
  }

  private async saveTranscription(result: TranscriptionResult) {
    try {
      const { error } = await supabase
        .from('conversation_logs')
        .insert({
          session_id: this.sessionId,
          speaker: result.speaker,
          text: result.text,
          confidence: result.confidence
        })

      if (error) {
        console.error('Failed to save transcription:', error)
      }
    } catch (error) {
      console.error('Error saving transcription:', error)
    }
  }

  private broadcastInterimResult(result: TranscriptionResult) {
    // Broadcast interim results via Supabase Realtime
    supabase
      .channel(`conversation-${this.sessionId}`)
      .send({
        type: 'broadcast',
        event: 'interim_transcription',
        payload: {
          text: result.text,
          speaker: result.speaker,
          confidence: result.confidence
        }
      })
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  isActive(): boolean {
    return this.isListening
  }
}

// Google Cloud Speech-to-Text API integration (server-side)
export class GoogleSpeechService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async transcribeAudio(audioBuffer: ArrayBuffer, config?: any): Promise<TranscriptionResult[]> {
    try {
      // Convert audio buffer to base64
      const base64Audio = this.arrayBufferToBase64(audioBuffer)

      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'ja-JP',
            enableAutomaticPunctuation: true,
            enableSpeakerDiarization: true,
            ...config
          }
        })
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      
      return data.results?.map((result: any) => ({
        text: result.alternatives[0].transcript,
        confidence: result.alternatives[0].confidence || 0.5,
        isFinal: true,
        speaker: this.determineSpeaker(result)
      })) || []

    } catch (error) {
      console.error('Google Speech API error:', error)
      return []
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private determineSpeaker(result: any): 'customer' | 'operator' {
    // TODO: Implement speaker diarization logic
    // For now, return customer as default
    return 'customer'
  }
}

// Audio processing utilities
export class AudioProcessor {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  async startRecording(stream: MediaStream): Promise<boolean> {
    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.chunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000) // Collect data every second
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob())
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        this.chunks = []
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(blob)
    })
  }
}