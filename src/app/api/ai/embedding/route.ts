import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Use text-embedding model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

    // Generate embedding
    const result = await model.embedContent(text)
    const embedding = result.embedding.values

    return NextResponse.json({
      success: true,
      embedding: embedding
    })

  } catch (error) {
    console.error('Embedding generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate embedding',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}