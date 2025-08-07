# SmartCall MVP - AI-Powered Call Center Solution

リアルタイム音声認識とAI支援によるコールセンター業務効率化システムのMVP実装

## 🌟 主要機能

- **リアルタイム通話**: WebRTC技術による高品質音声通話
- **音声認識**: Google Speech-to-Textによるリアルタイム文字起こし
- **AI支援**: Gemini AIによる応答提案と知識検索
- **3カラムダッシュボード**: 顧客情報、会話ログ、AI支援パネル
- **Lightning Design System**: Salesforce UXデザインシステム採用

## 🏗️ アーキテクチャ

```
Frontend (Next.js 14)
├── Customer Interface (/call)
├── Operator Dashboard (/operator)
└── API Routes (/api)
    ├── Speech Recognition
    ├── AI Suggestions
    └── Embeddings

Backend Services
├── Supabase (Database & Realtime)
├── Google Cloud Speech-to-Text
└── Google Gemini API
```

## 🚀 クイックスタート

### 1. プロジェクトのセットアップ

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを編集して、実際のAPIキーを設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# WebRTC
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
```

### 3. データベースの設定

Supabaseプロジェクトでテーブルを作成：

```sql
-- src/lib/supabase/schema.sqlの内容を実行
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてアクセス

## 📱 使い方

### お客様側
1. トップページから「お客様として通話する」をクリック
2. マイクへのアクセスを許可
3. 「コールする」ボタンで通話開始

### オペレーター側
1. トップページから「オペレーター画面を見る」をクリック
2. 着信時に応答ボタンで通話開始
3. リアルタイムでAI支援を受けながら対応

## 🛠️ 主要コンポーネント

### フロントエンド

- `src/app/page.tsx` - ランディングページ
- `src/app/call/page.tsx` - お客様通話インターフェース
- `src/app/operator/page.tsx` - オペレーターダッシュボード
- `src/components/dashboard/` - ダッシュボードコンポーネント

### バックエンド

- `src/lib/webrtc/config.ts` - WebRTC設定
- `src/lib/speech/recognition.ts` - 音声認識サービス
- `src/lib/ai/gemini.ts` - AI支援サービス
- `src/lib/supabase/client.ts` - データベース接続

### API Routes

- `/api/speech/transcribe` - 音声の文字起こし
- `/api/ai/suggestions` - AI応答提案
- `/api/ai/analysis` - 会話分析
- `/api/ai/embedding` - テキスト埋め込み

## 🔧 セットアップ詳細

### Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクト作成
2. `src/lib/supabase/schema.sql`を実行
3. API URLとAnon Keyを`.env.local`に設定

### Google Cloud APIの設定

1. [Google Cloud Console](https://console.cloud.google.com)でプロジェクト作成
2. Speech-to-Text APIとGenerative AI APIを有効化
3. サービスアカウントキーをダウンロード
4. 認証情報を環境変数に設定

### Gemini APIの設定

1. [Google AI Studio](https://aistudio.google.com)でAPIキー取得
2. `.env.local`に設定

## 📋 システム要件

- Node.js 18以上
- Chrome、Edge、Safariの最新版
- マイクアクセス権限
- 安定したインターネット接続

## 🔒 セキュリティ

- WebRTC DTLS-SRTP暗号化
- Supabase Row Level Security
- 環境変数による機密情報管理

## 📈 パフォーマンス目標

- 音声遅延: < 200ms
- 文字起こし遅延: < 1秒
- AI応答: < 2秒
- 同時通話数: 10セッション（MVP）

## 🧪 テスト

```bash
npm run build    # ビルドテスト
npm run dev      # 開発サーバー起動
```

## 📦 デプロイ

### Vercelでのデプロイ

1. Vercelアカウントに接続
2. 環境変数を設定
3. 自動デプロイ実行

```bash
vercel --prod
```

## 🔮 今後の拡張予定

- [ ] 通話録音機能
- [ ] 詳細な分析ダッシュボード
- [ ] 複数言語対応
- [ ] モバイルアプリ化
- [ ] チーム管理機能

## 📚 技術スタック

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lightning Design System
- **Backend**: Vercel Edge Functions
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI/ML**: Google Speech-to-Text, Gemini API
- **Communication**: WebRTC, Supabase Realtime

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

技術的な質問やフィードバックは、GitHubのIssuesでお願いします。

---

**作成日**: 2025年8月7日  
**バージョン**: 1.0.0  
**作成者**: Claude (SmartCall MVP Development Team)

🎉 **SmartCall MVPへようこそ！AIがサポートする次世代コールセンターシステムをお楽しみください。**
