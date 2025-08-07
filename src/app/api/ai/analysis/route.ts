import { NextRequest, NextResponse } from 'next/server'
import { GeminiAIService } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, conversationHistory } = await request.json()

    if (!sessionId || !conversationHistory) {
      return NextResponse.json(
        { error: 'Session ID and conversation history are required' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI service
    const aiService = new GeminiAIService({ sessionId })

    // Analyze conversation
    const analysis = await aiService.analyzeConversation(conversationHistory)

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Conversation analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze conversation',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}