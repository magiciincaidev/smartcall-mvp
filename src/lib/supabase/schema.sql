-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for vector operations (for RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Call sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  operator_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('ringing', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation logs table
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(20) CHECK (speaker IN ('customer', 'operator')),
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Knowledge base table for RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_operator_id ON call_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_id ON conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_timestamp ON conversation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_session_id ON ai_suggestions(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);

-- Enable Realtime for relevant tables
ALTER TABLE call_sessions REPLICA IDENTITY FULL;
ALTER TABLE conversation_logs REPLICA IDENTITY FULL;
ALTER TABLE ai_suggestions REPLICA IDENTITY FULL;

-- RLS (Row Level Security) Policies
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for MVP - adjust for production)
CREATE POLICY "Enable all access for call_sessions" ON call_sessions
  FOR ALL USING (true);

CREATE POLICY "Enable all access for conversation_logs" ON conversation_logs
  FOR ALL USING (true);

CREATE POLICY "Enable all access for ai_suggestions" ON ai_suggestions
  FOR ALL USING (true);

CREATE POLICY "Enable read access for knowledge_base" ON knowledge_base
  FOR SELECT USING (true);

-- Sample data for knowledge base
INSERT INTO knowledge_base (category, question, answer) VALUES
  ('greeting', 'こんにちは', 'お電話ありがとうございます。本日はどのようなご用件でしょうか？'),
  ('greeting', 'はじめまして', 'お電話ありがとうございます。私、○○が承ります。どのようなご用件でしょうか？'),
  ('product', '商品について', '商品についてのお問い合わせですね。どの商品についてお知りになりたいでしょうか？'),
  ('support', 'サポート', 'サポートについてお手伝いさせていただきます。どのような問題でお困りでしょうか？'),
  ('closing', 'ありがとう', 'こちらこそ、お電話いただきありがとうございました。他にご不明な点はございませんか？');