# Supabase セットアップガイド

## 🚀 クイックスタート

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン
4. 「New project」を選択
5. Organization を選択
6. プロジェクト名: `smartcall-mvp`
7. Database Password を設定（強力なパスワードを推奨）
8. Region を選択（Asia Northeast (Tokyo) 推奨）
9. 「Create new project」をクリック

### 2. 環境変数の更新

プロジェクト作成完了後、「Settings」→「API」から以下の値を取得：

```env
# .env.local を更新
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. データベーススキーマの実行

Supabase Dashboard の「SQL Editor」で以下のスクリプトを実行：

\`\`\`sql
-- Vector拡張機能を有効化
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
\`\`\`

### 4. Row Level Security (RLS) の設定

セキュリティ設定（本番環境では調整が必要）：

\`\`\`sql
-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies (開発用 - 本番では制限を強化)
CREATE POLICY "Enable all access for call_sessions" ON call_sessions
  FOR ALL USING (true);

CREATE POLICY "Enable all access for conversation_logs" ON conversation_logs
  FOR ALL USING (true);

CREATE POLICY "Enable all access for ai_suggestions" ON ai_suggestions
  FOR ALL USING (true);

CREATE POLICY "Enable read access for knowledge_base" ON knowledge_base
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for knowledge_base" ON knowledge_base
  FOR INSERT WITH CHECK (true);
\`\`\`

### 5. 初期データの投入

ナレッジベースに初期データを投入：

\`\`\`sql
INSERT INTO knowledge_base (category, question, answer) VALUES
  ('greeting', 'こんにちは', 'お電話ありがとうございます。本日はどのようなご用件でしょうか？'),
  ('greeting', 'はじめまして', 'お電話ありがとうございます。私、○○が承ります。どのようなご用件でしょうか？'),
  ('greeting', 'お疲れ様です', 'お疲れ様です。お電話ありがとうございます。どのようなご用件でしょうか？'),
  
  ('product', '商品について教えて', '商品についてのお問い合わせですね。どの商品についてお知りになりたいでしょうか？'),
  ('product', '価格を知りたい', '価格についてお答えいたします。どちらの商品の価格をお知りになりたいでしょうか？'),
  ('product', '在庫はありますか', '在庫状況を確認いたします。少々お待ちください。'),
  
  ('support', 'サポートが必要', 'サポートについてお手伝いさせていただきます。どのような問題でお困りでしょうか？'),
  ('support', '使い方がわからない', '使い方についてご説明いたします。どの部分でお困りでしょうか？'),
  ('support', '故障している', '故障の件でございますね。詳細をお聞かせください。すぐに対応いたします。'),
  
  ('order', '注文したい', 'ご注文のお手続きをさせていただきます。ご希望の商品はございますか？'),
  ('order', 'キャンセルしたい', 'ご注文のキャンセルですね。注文番号をお教えいただけますでしょうか？'),
  ('order', '変更したい', 'ご注文内容の変更ですね。どちらを変更されたいでしょうか？'),
  
  ('closing', 'ありがとうございました', 'こちらこそ、お電話いただきありがとうございました。他にご不明な点はございませんか？'),
  ('closing', '解決しました', 'お役に立てて良かったです。また何かございましたら、お気軽にお電話ください。'),
  ('closing', '満足です', 'ご満足いただけて何よりです。今後ともよろしくお願いいたします。')
ON CONFLICT DO NOTHING;
\`\`\`

### 6. Realtimeの有効化

Supabase Dashboard で「Settings」→「API」→「Realtime」:

1. 以下のテーブルでRealtimeを有効化:
   - `call_sessions`
   - `conversation_logs`
   - `ai_suggestions`

2. または SQL で設定:

\`\`\`sql
-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_suggestions;
\`\`\`

### 7. Vector検索関数の作成

RAG機能用の検索関数を作成：

\`\`\`sql
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
    1 - (knowledge_base.embedding <=> $1::vector) as similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> $1::vector) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Document matching function
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
  WHERE knowledge_base.embedding IS NOT NULL
    AND 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
\`\`\`

## 🧪 動作テスト

### データベース接続のテスト

以下のクエリでテーブル作成を確認：

\`\`\`sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('call_sessions', 'conversation_logs', 'ai_suggestions', 'knowledge_base')
ORDER BY table_name, ordinal_position;
\`\`\`

### 初期データの確認

\`\`\`sql
SELECT category, COUNT(*) as count 
FROM knowledge_base 
GROUP BY category;
\`\`\`

### テストセッションの作成

\`\`\`sql
-- テスト通話セッションを作成
INSERT INTO call_sessions (customer_name, customer_phone, status)
VALUES ('テスト太郎', '090-1234-5678', 'ringing')
RETURNING *;

-- 会話ログのテスト
INSERT INTO conversation_logs (session_id, speaker, text)
VALUES (
  (SELECT id FROM call_sessions ORDER BY created_at DESC LIMIT 1),
  'customer',
  'こんにちは、商品について教えてください'
);
\`\`\`

## 📱 アプリケーションでのテスト

環境変数更新後、アプリケーションを再起動：

\`\`\`bash
# 開発サーバーを停止 (Ctrl+C)
npm run dev
\`\`\`

ブラウザで以下をテスト：

1. `http://localhost:3000/call` - 通話画面
2. `http://localhost:3000/operator` - オペレーター画面
3. ブラウザの開発者ツールでSupabaseとの通信を確認

## 🔒 セキュリティ設定（本番向け）

本番環境では以下を設定：

1. **RLS Policy の強化**
2. **API Key の制限**
3. **CORS の設定**
4. **レート制限**

\`\`\`sql
-- より厳密なRLSポリシーの例
CREATE POLICY "Users can view their own sessions" ON call_sessions
  FOR SELECT USING (auth.uid()::text = operator_id::text);
\`\`\`

## 📞 サポート

問題が発生した場合：

1. Supabase Dashboard のログを確認
2. ブラウザの開発者ツールでエラーを確認
3. 環境変数が正しく設定されているか確認

---

✅ **Supabaseセットアップ完了後、SmartCall MVPの全機能が利用可能になります！**