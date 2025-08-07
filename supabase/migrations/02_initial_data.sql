-- SmartCall MVP Initial Data
-- Execute this after running 01_initial_schema.sql

-- ================================================
-- OPERATORS DATA
-- ================================================

INSERT INTO operators (id, name, email, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '田中 太郎', 'tanaka@smartcall.com', 'online'),
  ('550e8400-e29b-41d4-a716-446655440001', '佐藤 花子', 'sato@smartcall.com', 'online'),
  ('550e8400-e29b-41d4-a716-446655440002', '鈴木 次郎', 'suzuki@smartcall.com', 'offline')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ================================================
-- KNOWLEDGE BASE DATA
-- ================================================

-- Greeting responses
INSERT INTO knowledge_base (category, question, answer, tags, priority) VALUES
  ('greeting', 'こんにちは', 'お電話ありがとうございます。本日はどのようなご用件でしょうか？', ARRAY['挨拶', '基本'], 1),
  ('greeting', 'はじめまして', 'お電話ありがとうございます。私、○○が承ります。どのようなご用件でしょうか？', ARRAY['挨拶', '初回'], 1),
  ('greeting', 'お疲れ様です', 'お疲れ様です。お電話ありがとうございます。どのようなご用件でしょうか？', ARRAY['挨拶', 'ビジネス'], 1),
  ('greeting', 'おはようございます', 'おはようございます。お電話ありがとうございます。本日はどのようなご用件でしょうか？', ARRAY['挨拶', '朝'], 1),
  ('greeting', 'お忙しいところすみません', 'いえいえ、とんでもございません。お電話いただきありがとうございます。どのようなご用件でしょうか？', ARRAY['挨拶', '謙遜'], 2),

-- Product inquiries
  ('product', '商品について教えて', '商品についてのお問い合わせですね。どの商品についてお知りになりたいでしょうか？', ARRAY['商品', '一般'], 1),
  ('product', '価格を知りたい', '価格についてお答えいたします。どちらの商品の価格をお知りになりたいでしょうか？', ARRAY['商品', '価格'], 1),
  ('product', '在庫はありますか', '在庫状況を確認いたします。少々お待ちください。商品名をお教えいただけますでしょうか？', ARRAY['商品', '在庫'], 1),
  ('product', 'スペックを教えて', '商品の仕様についてご説明いたします。どちらの商品のスペックをお知りになりたいでしょうか？', ARRAY['商品', '仕様'], 2),
  ('product', '新商品はありますか', '新商品についてご案内いたします。どのようなカテゴリーの商品をお探しでしょうか？', ARRAY['商品', '新商品'], 2),

-- Support requests
  ('support', 'サポートが必要', 'サポートについてお手伝いさせていただきます。どのような問題でお困りでしょうか？', ARRAY['サポート', '一般'], 1),
  ('support', '使い方がわからない', '使い方についてご説明いたします。どの部分でお困りでしょうか？詳しくお聞かせください。', ARRAY['サポート', '使い方'], 1),
  ('support', '故障している', '故障の件でございますね。詳細をお聞かせください。すぐに対応いたします。', ARRAY['サポート', '故障', '緊急'], 1),
  ('support', 'エラーが出る', 'エラーの件ですね。どのようなエラーメッセージが表示されますでしょうか？', ARRAY['サポート', 'エラー'], 1),
  ('support', '設定方法を教えて', '設定方法についてご説明いたします。どちらの設定でお困りでしょうか？', ARRAY['サポート', '設定'], 2),

-- Order management
  ('order', '注文したい', 'ご注文のお手続きをさせていただきます。ご希望の商品はございますか？', ARRAY['注文', '新規'], 1),
  ('order', 'キャンセルしたい', 'ご注文のキャンセルですね。注文番号をお教えいただけますでしょうか？', ARRAY['注文', 'キャンセル'], 1),
  ('order', '変更したい', 'ご注文内容の変更ですね。どちらを変更されたいでしょうか？注文番号もお教えください。', ARRAY['注文', '変更'], 1),
  ('order', '配送状況を知りたい', '配送状況を確認いたします。注文番号をお教えいただけますでしょうか？', ARRAY['注文', '配送'], 1),
  ('order', '返品したい', '返品のお手続きについてご案内いたします。返品理由をお聞かせいただけますでしょうか？', ARRAY['注文', '返品'], 2),

-- Payment inquiries  
  ('payment', '支払い方法について', 'お支払い方法についてご案内いたします。どのようなお支払い方法をご希望でしょうか？', ARRAY['決済', '方法'], 1),
  ('payment', '請求書を送って', '請求書の発行についてお手続きいたします。ご請求先の住所をご確認させてください。', ARRAY['決済', '請求書'], 1),
  ('payment', '領収書がほしい', '領収書の発行をいたします。宛名はいかがいたしますでしょうか？', ARRAY['決済', '領収書'], 1),
  ('payment', 'クレジットカードが使えない', 'クレジットカードの件ですね。エラーメッセージなど表示されましたでしょうか？', ARRAY['決済', 'クレジットカード'], 1),

-- Closing responses
  ('closing', 'ありがとうございました', 'こちらこそ、お電話いただきありがとうございました。他にご不明な点はございませんか？', ARRAY['終了', '感謝'], 1),
  ('closing', '解決しました', 'お役に立てて良かったです。また何かございましたら、お気軽にお電話ください。', ARRAY['終了', '解決'], 1),
  ('closing', '満足です', 'ご満足いただけて何よりです。今後ともよろしくお願いいたします。', ARRAY['終了', '満足'], 1),
  ('closing', 'また連絡します', '承知いたしました。いつでもお気軽にお電話ください。お待ちしております。', ARRAY['終了', '継続'], 2),
  ('closing', '検討します', 'ご検討いただきありがとうございます。ご質問がございましたら、いつでもお声かけください。', ARRAY['終了', '検討'], 2),

-- Emergency and escalation
  ('escalation', '責任者と話したい', '承知いたしました。責任者におつなぎいたします。少々お待ちください。', ARRAY['エスカレーション', '責任者'], 1),
  ('escalation', '苦情があります', '申し訳ございません。詳しくお聞かせいただけますでしょうか？', ARRAY['エスカレーション', '苦情'], 1),
  ('escalation', '急いでいます', '緊急のご用件ですね。優先してお手続きいたします。詳細をお聞かせください。', ARRAY['エスカレーション', '緊急'], 1),

-- Technical issues
  ('technical', 'ネットワークエラー', 'ネットワークの問題の可能性がございます。一度再接続をお試しいただけますでしょうか？', ARRAY['技術', 'ネットワーク'], 1),
  ('technical', 'ログインできない', 'ログインの問題ですね。パスワードの再設定をお試しいただけますでしょうか？', ARRAY['技術', 'ログイン'], 1),
  ('technical', 'サイトが見れない', 'サイトの表示問題ですね。ブラウザのキャッシュをクリアしていただけますでしょうか？', ARRAY['技術', 'サイト'], 2)

ON CONFLICT DO NOTHING;

-- ================================================
-- DEMO CALL SESSION
-- ================================================

-- Create a demo call session for testing
INSERT INTO call_sessions (id, customer_name, customer_phone, operator_id, status) VALUES
  ('demo-session-001', 'デモ太郎', '090-1234-5678', '550e8400-e29b-41d4-a716-446655440000', 'active')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Add some demo conversation logs
INSERT INTO conversation_logs (session_id, speaker, text, confidence) VALUES
  ('demo-session-001', 'customer', 'こんにちは、商品について教えてください', 0.95),
  ('demo-session-001', 'operator', 'お電話ありがとうございます。どちらの商品についてお知りになりたいでしょうか？', 1.0),
  ('demo-session-001', 'customer', '新しいスマートフォンの価格を知りたいです', 0.92)
ON CONFLICT DO NOTHING;

-- Add some demo AI suggestions
INSERT INTO ai_suggestions (session_id, suggestion, context, category, confidence) VALUES
  ('demo-session-001', '最新のスマートフォンの価格表をご案内いたします。', '価格についての問い合わせ', 'response', 0.88),
  ('demo-session-001', '在庫状況も併せて確認いたしましょうか？', '商品に関する追加提案', 'response', 0.85),
  ('demo-session-001', 'お客様のご予算に合わせた商品もご提案できます。', 'カスタマイズされた提案', 'response', 0.82)
ON CONFLICT DO NOTHING;

-- ================================================
-- REALTIME SUBSCRIPTION SETUP
-- ================================================

-- Enable realtime for the tables we need
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE operators;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Verify data insertion
DO $$
DECLARE
    operators_count INTEGER;
    knowledge_count INTEGER;
    sessions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO operators_count FROM operators;
    SELECT COUNT(*) INTO knowledge_count FROM knowledge_base;
    SELECT COUNT(*) INTO sessions_count FROM call_sessions;
    
    RAISE NOTICE 'Data verification:';
    RAISE NOTICE '- Operators: % records', operators_count;
    RAISE NOTICE '- Knowledge base: % records', knowledge_count;
    RAISE NOTICE '- Call sessions: % records', sessions_count;
    RAISE NOTICE '';
    RAISE NOTICE 'SmartCall MVP initial data loaded successfully!';
    RAISE NOTICE 'Ready for testing at http://localhost:3000';
END $$;