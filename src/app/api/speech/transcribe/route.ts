import { NextRequest, NextResponse } from 'next/server'
import { SpeechClient } from '@google-cloud/speech'

// Initialize Google Cloud Speech client
let speechClient: SpeechClient | null = null

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    speechClient = new SpeechClient()
  }
} catch (error) {
  console.warn('Google Speech client not initialized:', error)
}

export async function POST(request: NextRequest) {
  try {
    if (!speechClient) {
      return NextResponse.json(
        { error: 'Google Speech API not configured' },
        { status: 500 }
      )
    }

    const { audio, config } = await request.json()

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      )
    }

    // Configure the recognition request
    const recognitionConfig = {
      encoding: config?.encoding || 'WEBM_OPUS',
      sampleRateHertz: config?.sampleRateHertz || 48000,
      languageCode: config?.languageCode || 'ja-JP',
      enableAutomaticPunctuation: config?.enableAutomaticPunctuation ?? true,
      enableSpeakerDiarization: config?.enableSpeakerDiarization ?? true,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 2,
      },
      model: 'latest_long',
      useEnhanced: true,
    }

    const request_payload = {
      config: recognitionConfig,
      audio: {
        content: audio,
      },
    }

    // Perform the transcription
    const [response] = await speechClient.recognize(request_payload)

    // Process results
    const transcriptions = response.results?.map((result) => {
      const alternative = result.alternatives?.[0]
      return {
        transcript: alternative?.transcript || '',
        confidence: alternative?.confidence || 0,
        words: alternative?.words?.map((word) => ({
          word: word.word,
          startTime: word.startTime,
          endTime: word.endTime,
          speakerTag: word.speakerTag,
        })),
      }
    })

    return NextResponse.json({
      success: true,
      results: transcriptions || [],
    })

  } catch (error) {
    console.error('Speech transcription error:', error)
    
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Streaming transcription endpoint
export async function PUT(request: NextRequest) {
  try {
    if (!speechClient) {
      return NextResponse.json(
        { error: 'Google Speech API not configured' },
        { status: 500 }
      )
    }

    // This would handle streaming recognition
    // For now, return a simple response
    return NextResponse.json({
      success: true,
      message: 'Streaming endpoint - not yet implemented'
    })

  } catch (error) {
    console.error('Streaming transcription error:', error)
    
    return NextResponse.json(
      { error: 'Streaming transcription failed' },
      { status: 500 }
    )
  }
}