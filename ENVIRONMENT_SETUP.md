# 🔧 環境変数セットアップガイド

## 📋 クイックセットアップ

### 1. 環境変数ファイルを作成

```bash
cp .env.example .env.local
```

### 2. 必要な値を設定

`.env.local`ファイルを編集して、以下の手順で各サービスの認証情報を取得・設定してください。

## 🗄️ Supabase設定

### プロジェクト作成と設定取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New project」でプロジェクト作成
3. プロジェクト名: `smartcall-mvp`
4. 強力なデータベースパスワードを設定
5. リージョン: `Asia Northeast (Tokyo)`

### API認証情報の取得

プロジェクト作成後、「Settings」→「API」から取得：

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 重要**: 
- `ANON_KEY`はフロントエンドで使用（公開OK）
- `SERVICE_ROLE_KEY`はサーバーサイドのみ（秘匿）

## 🤖 Google Cloud & Gemini AI設定

### Google Cloud Platform設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. 以下のAPIを有効化：
   - Cloud Speech-to-Text API
   - Generative AI API (Gemini)

### サービスアカウント作成

1. 「IAM & Admin」→「Service Accounts」
2. 「Create Service Account」
3. 役割を追加：
   - Speech Client
   - AI Platform User
4. JSONキーをダウンロード

### 設定値

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
```

### Gemini API設定

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」
3. プロジェクトを選択

```env
GEMINI_API_KEY=AIzaSyAbc123...
```

## 🌐 WebRTC設定

### 基本設定（無料）

```env
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
```

### TURNサーバー（推奨、有料）

NAT/ファイアウォール環境でも確実に接続するため：

**オプション1: Twilio**
1. [Twilio Console](https://www.twilio.com/console) でアカウント作成
2. 「Programmable Video」→「TURN」で設定取得

**オプション2: Metered TURN**
1. [Metered.ca](https://www.metered.ca/tools/openrelay/) の無料TURNサービス

```env
NEXT_PUBLIC_TURN_SERVER=turn:global-relay.metered.ca:80
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
```

## ✅ 設定確認

### 必須設定のチェック

```bash
# 設定ファイルの存在確認
ls -la .env.local

# 必要な変数が設定されているか確認
grep -E "SUPABASE_URL|GEMINI_API_KEY" .env.local
```

### アプリケーションテスト

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

### データベース接続テスト

開発者ツールのコンソールで確認：

```javascript
// Supabase接続テスト
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

## 🚀 デプロイ用設定

### Vercel デプロイ

Vercel Dashboard で環境変数を設定：

1. プロジェクト設定 → Environment Variables
2. `.env.local`の内容をコピー
3. 本番環境用の値に更新

**重要な変更点:**

```env
# 本番用URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# 本番環境識別
NODE_ENV=production

# セキュリティ設定
ALLOWED_ORIGINS=https://your-domain.com
```

### セキュリティチェック

- [ ] `.env.local`が`.gitignore`に含まれている
- [ ] サービスロールキーが秘匿されている  
- [ ] 本番環境でデバッグモードが無効
- [ ] CORSが適切に設定されている

## 🔍 トラブルシューティング

### よくあるエラー

**1. Supabase接続エラー**
```
Error: Invalid URL
```
→ `NEXT_PUBLIC_SUPABASE_URL`が正しく設定されているか確認

**2. Gemini API エラー**
```
Error: API key not configured
```
→ `GEMINI_API_KEY`が正しく設定されているか確認

**3. Google Cloud認証エラー**
```
Error: Could not load the default credentials
```
→ サービスアカウントJSONファイルのパスを確認

### ログ確認

```bash
# 開発サーバーのログ確認
npm run dev

# ビルドログ確認  
npm run build
```

## 📞 サポート

設定で困った場合：

1. [GitHub Issues](https://github.com/magiciincaidev/smartcall-mvp/issues) で質問
2. ドキュメントを再確認
3. 各サービスの公式ドキュメントを参照

---

**✅ 設定完了後、SmartCall MVPの全機能が利用可能になります！**