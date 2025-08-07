-- SmartCall MVP Database Schema
-- Execute this in Supabase Dashboard SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================
-- TABLES
-- ================================================

-- Call sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  operator_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('ringing', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation logs table
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(20) CHECK (speaker IN ('customer', 'operator')),
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  context TEXT,
  category VARCHAR(50) DEFAULT 'response',
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Knowledge base table for RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding VECTOR(768),
  tags TEXT[],
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  status VARCHAR(20) CHECK (status IN ('online', 'offline', 'busy')) DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  duration_seconds INTEGER,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  topics TEXT[],
  ai_suggestions_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_operator_id ON call_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at ON call_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_id ON conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_timestamp ON conversation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_speaker ON conversation_logs(speaker);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_session_id ON ai_suggestions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_used ON ai_suggestions(used);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_category ON ai_suggestions(category);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);

CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER update_call_sessions_updated_at 
    BEFORE UPDATE ON call_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_operators_updated_at 
    BEFORE UPDATE ON operators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_text text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  question text,
  answer text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.question,
    knowledge_base.answer,
    1 - (knowledge_base.embedding <=> query_text::vector) as similarity
  FROM knowledge_base
  WHERE knowledge_base.is_active = true
    AND knowledge_base.embedding IS NOT NULL
    AND 1 - (knowledge_base.embedding <=> query_text::vector) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Document matching function with embeddings
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  question text,
  answer text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.question,
    knowledge_base.answer,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE knowledge_base.is_active = true
    AND knowledge_base.embedding IS NOT NULL
    AND 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Get active operators function
CREATE OR REPLACE FUNCTION get_available_operators()
RETURNS TABLE (
  id uuid,
  name text,
  status text
)
LANGUAGE sql
AS $$
  SELECT id, name, status
  FROM operators
  WHERE status = 'online'
  ORDER BY updated_at DESC;
$$;

-- ================================================
-- REALTIME
-- ================================================

-- Enable Realtime for tables that need live updates
ALTER TABLE call_sessions REPLICA IDENTITY FULL;
ALTER TABLE conversation_logs REPLICA IDENTITY FULL;
ALTER TABLE ai_suggestions REPLICA IDENTITY FULL;
ALTER TABLE operators REPLICA IDENTITY FULL;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for development (adjust for production)
CREATE POLICY "Enable all access for call_sessions during development" ON call_sessions
  FOR ALL USING (true);

CREATE POLICY "Enable all access for conversation_logs during development" ON conversation_logs
  FOR ALL USING (true);

CREATE POLICY "Enable all access for ai_suggestions during development" ON ai_suggestions
  FOR ALL USING (true);

CREATE POLICY "Enable read access for knowledge_base" ON knowledge_base
  FOR SELECT USING (is_active = true);

CREATE POLICY "Enable insert access for knowledge_base" ON knowledge_base
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for knowledge_base" ON knowledge_base
  FOR UPDATE USING (true);

CREATE POLICY "Enable all access for operators during development" ON operators
  FOR ALL USING (true);

CREATE POLICY "Enable all access for call_analytics during development" ON call_analytics
  FOR ALL USING (true);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE call_sessions IS 'Stores information about phone call sessions';
COMMENT ON TABLE conversation_logs IS 'Stores real-time transcription logs';
COMMENT ON TABLE ai_suggestions IS 'Stores AI-generated suggestions for operators';
COMMENT ON TABLE knowledge_base IS 'Stores knowledge base for RAG functionality';
COMMENT ON TABLE operators IS 'Stores operator information and status';
COMMENT ON TABLE call_analytics IS 'Stores call analytics and metrics';

COMMENT ON FUNCTION search_knowledge_base IS 'Vector similarity search in knowledge base';
COMMENT ON FUNCTION match_documents IS 'Match documents using vector embeddings';
COMMENT ON FUNCTION get_available_operators IS 'Get list of available operators';

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'SmartCall MVP database schema created successfully!';
    RAISE NOTICE 'Tables created: call_sessions, conversation_logs, ai_suggestions, knowledge_base, operators, call_analytics';
    RAISE NOTICE 'Functions created: search_knowledge_base, match_documents, get_available_operators';
    RAISE NOTICE 'Next step: Run 02_initial_data.sql to populate initial data';
END $$;