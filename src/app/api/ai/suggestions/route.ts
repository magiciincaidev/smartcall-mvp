import { NextRequest, NextResponse } from 'next/server'
import { GeminiAIService } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, conversationHistory, currentContext, customerInfo, requestType } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI service
    const aiService = new GeminiAIService({ sessionId })

    // Generate suggestions
    const suggestions = await aiService.generateResponseSuggestions({
      conversationHistory: conversationHistory || '',
      currentContext: currentContext || '',
      customerInfo,
      requestType: requestType || 'response'
    })

    // Save suggestions to database (optional)
    for (const suggestion of suggestions.suggestions) {
      await aiService.saveSuggestion(
        suggestion,
        `${conversationHistory}\n\n${currentContext}`,
        false
      )
    }

    return NextResponse.json({
      success: true,
      data: suggestions
    })

  } catch (error) {
    console.error('AI suggestions error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get recent suggestions from database
    const { supabase } = await import('@/lib/supabase/client')
    
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Get suggestions error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}