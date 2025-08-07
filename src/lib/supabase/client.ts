import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CallSession = {
  id: string
  customer_phone: string
  customer_name: string
  operator_id?: string
  started_at: string
  ended_at?: string
  status: 'ringing' | 'active' | 'ended'
}

export type ConversationLog = {
  id: string
  session_id: string
  speaker: 'customer' | 'operator'
  text: string
  timestamp: string
  confidence?: number
}

export type AISuggestion = {
  id: string
  session_id: string
  suggestion: string
  context: string
  created_at: string
  used: boolean
}

export type KnowledgeBase = {
  id: string
  category: string
  question: string
  answer: string
  embedding?: number[]
  created_at: string
}