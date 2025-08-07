# Supabase 実行ガイド

## 🚀 Supabaseプロジェクトセットアップ手順

### ステップ 1: Supabaseプロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New project」をクリック
3. プロジェクト詳細を入力：
   - **Name**: `smartcall-mvp`
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Asia Northeast (Tokyo)`
4. 「Create new project」をクリック（約2分で完了）

### ステップ 2: スキーマの実行

プロジェクト作成後、以下の順番でSQLを実行：

#### 1. メインスキーマの実行

Supabase Dashboard → SQL Editor → New Query

```sql
-- supabase/migrations/01_initial_schema.sql の内容をコピー&ペースト
```

**実行**: 「Run」ボタンをクリック

#### 2. 初期データの投入

新しいクエリを作成：

```sql
-- supabase/migrations/02_initial_data.sql の内容をコピー&ペースト  
```

**実行**: 「Run」ボタンをクリック

### ステップ 3: 環境変数の更新

Supabase Dashboard → Settings → API から以下を取得：

```env
# .env.local を更新
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### ステップ 4: リアルタイム機能の有効化

Supabase Dashboard → Settings → API → Realtime:

以下のテーブルをチェック：
- ✅ `call_sessions`
- ✅ `conversation_logs`
- ✅ `ai_suggestions`
- ✅ `operators`

### ステップ 5: 動作確認

```bash
# アプリケーション再起動
npm run dev
```

ブラウザで確認：
- http://localhost:3000 - ランディングページ
- http://localhost:3000/call - 顧客通話画面
- http://localhost:3000/operator - オペレーターダッシュボード

## 🔧 データベース確認コマンド

### テーブル作成確認

```sql
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE tablename IN ('call_sessions', 'conversation_logs', 'ai_suggestions', 'knowledge_base', 'operators')
ORDER BY tablename;
```

### 初期データ確認

```sql
-- オペレーター数
SELECT COUNT(*) as operator_count FROM operators;

-- ナレッジベースエントリー数
SELECT category, COUNT(*) as count 
FROM knowledge_base 
GROUP BY category 
ORDER BY category;

-- デモセッション確認  
SELECT * FROM call_sessions WHERE customer_name = 'デモ太郎';
```

### 関数動作テスト

```sql
-- 利用可能オペレーター取得
SELECT * FROM get_available_operators();

-- ナレッジベース検索（ベクター検索なしの場合）
SELECT id, category, question, answer 
FROM knowledge_base 
WHERE category = 'greeting' 
LIMIT 3;
```

## 🔍 トラブルシューティング

### エラー: "extension vector does not exist"

Vector拡張機能の有効化:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### エラー: "function gen_random_uuid() does not exist"

UUID拡張機能の有効化:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### リアルタイム通信が動作しない

1. Realtime設定を確認
2. RLS Policyを確認
3. ブラウザのWebSocket接続を確認

## 📊 パフォーマンス最適化

### 大量データ対応

```sql
-- インデックス確認
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('call_sessions', 'conversation_logs', 'knowledge_base');

-- Vector インデックス追加（大量データの場合）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_embedding_hnsw
ON knowledge_base USING hnsw (embedding vector_cosine_ops);
```

## 🔒 本番環境設定

### RLS Policyの強化

```sql
-- 開発用から本番用に変更
DROP POLICY IF EXISTS "Enable all access for call_sessions during development" ON call_sessions;

CREATE POLICY "Operators can access their sessions" ON call_sessions
  FOR ALL TO authenticated
  USING (operator_id = auth.uid());
```

### APIキー管理

- Anon Keyは公開OK
- Service Role Keyは秘匿
- 本番環境ではAPIキー制限を設定

## ✅ セットアップ完了チェックリスト

- [ ] Supabaseプロジェクト作成完了
- [ ] 01_initial_schema.sql実行完了
- [ ] 02_initial_data.sql実行完了
- [ ] 環境変数更新完了
- [ ] リアルタイム機能有効化完了
- [ ] アプリケーション動作確認完了
- [ ] データベース接続確認完了

---

**実行完了後、SmartCall MVPが完全に動作します！**