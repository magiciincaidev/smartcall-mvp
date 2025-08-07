import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase/client'

export interface AIAssistantConfig {
  sessionId: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface SuggestionRequest {
  conversationHistory: string
  currentContext: string
  customerInfo?: any
  requestType: 'response' | 'information' | 'analysis'
}

export interface SuggestionResponse {
  suggestions: string[]
  relevantInfo: any[]
  alerts: string[]
  confidence: number
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI
  private model: any
  private sessionId: string

  constructor(config: AIAssistantConfig) {
    const apiKey = process.env.GEMINI_API_KEY || 'dummy-key'
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 1024,
      }
    })
    this.sessionId = config.sessionId
  }

  async generateResponseSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    try {
      const prompt = this.buildResponsePrompt(request)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseResponse(text)
    } catch (error) {
      console.error('Gemini API error:', error)
      return this.getFallbackSuggestions()
    }
  }

  private buildResponsePrompt(request: SuggestionRequest): string {
    const { conversationHistory, currentContext, customerInfo } = request

    return `
あなたはコールセンターのAIアシスタントです。オペレーターが適切に顧客対応できるよう支援してください。

## 会話履歴:
${conversationHistory}

## 現在の文脈:
${currentContext}

## 顧客情報:
${customerInfo ? JSON.stringify(customerInfo, null, 2) : '情報なし'}

## タスク:
以下のJSON形式で応答してください：

{
  "suggestions": [
    "適切な応答例1（自然で丁寧な日本語）",
    "適切な応答例2（状況に応じた代替案）",
    "適切な応答例3（必要に応じて）"
  ],
  "relevantInfo": [
    {
      "title": "関連情報のタイトル",
      "content": "具体的な情報内容",
      "category": "product|support|policy"
    }
  ],
  "alerts": [
    "注意すべきポイントがあれば記載"
  ],
  "confidence": 0.85
}

## 応答ガイドライン:
1. 自然で丁寧な敬語を使用
2. 顧客の感情に配慮した表現
3. 具体的で実用的な内容
4. 企業の品格を保った対応
5. 必要に応じてエスカレーションを提案

JSON形式のみで応答してください。説明文は不要です。
`
  }

  private parseResponse(text: string): SuggestionResponse {
    try {
      // Clean up the response text
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      
      return {
        suggestions: parsed.suggestions || [],
        relevantInfo: parsed.relevantInfo || [],
        alerts: parsed.alerts || [],
        confidence: parsed.confidence || 0.5
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return this.getFallbackSuggestions()
    }
  }

  private getFallbackSuggestions(): SuggestionResponse {
    return {
      suggestions: [
        "ありがとうございます。確認いたします。",
        "少々お待ちください。お調べいたします。",
        "詳しくご説明いたします。"
      ],
      relevantInfo: [],
      alerts: [],
      confidence: 0.3
    }
  }

  async analyzeConversation(conversationHistory: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    topics: string[]
    urgency: 'low' | 'medium' | 'high'
    summary: string
  }> {
    try {
      const prompt = `
会話を分析して以下の情報を抽出してください：

会話内容:
${conversationHistory}

JSON形式で応答してください：
{
  "sentiment": "positive|neutral|negative",
  "topics": ["話題1", "話題2"],
  "urgency": "low|medium|high",
  "summary": "会話の要約"
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error('Conversation analysis error:', error)
      return {
        sentiment: 'neutral',
        topics: [],
        urgency: 'medium',
        summary: '分析できませんでした'
      }
    }
  }

  async searchKnowledgeBase(query: string, limit: number = 5): Promise<any[]> {
    try {
      // Use Supabase vector search for knowledge base
      const { data, error } = await supabase
        .rpc('search_knowledge_base', {
          query_text: query,
          match_threshold: 0.7,
          match_count: limit
        })

      if (error) {
        console.error('Knowledge base search error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Knowledge base search error:', error)
      return []
    }
  }

  async saveSuggestion(suggestion: string, context: string, used: boolean = false): Promise<void> {
    try {
      await supabase
        .from('ai_suggestions')
        .insert({
          session_id: this.sessionId,
          suggestion,
          context,
          used
        })
    } catch (error) {
      console.error('Failed to save suggestion:', error)
    }
  }
}

// RAG (Retrieval-Augmented Generation) service
export class RAGService {
  private supabase: any
  private embeddingModel: string

  constructor() {
    this.supabase = supabase
    this.embeddingModel = 'text-embedding-004'
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Call Google's embedding API
      const response = await fetch('/api/ai/embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Embedding generation failed')
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('Embedding generation error:', error)
      return []
    }
  }

  async addToKnowledgeBase(
    category: string, 
    question: string, 
    answer: string
  ): Promise<void> {
    try {
      // Generate embedding for the question
      const embedding = await this.generateEmbedding(question)

      // Insert into knowledge base
      const { error } = await this.supabase
        .from('knowledge_base')
        .insert({
          category,
          question,
          answer,
          embedding
        })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Failed to add to knowledge base:', error)
      throw error
    }
  }

  async searchSimilarDocuments(query: string, threshold: number = 0.7): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)

      // Search for similar documents using vector similarity
      const { data, error } = await this.supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: 5
        })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Document search error:', error)
      return []
    }
  }
}