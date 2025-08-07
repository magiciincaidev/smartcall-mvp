import Link from 'next/link'
import { Phone, Headphones, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="slds-scope min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="slds-page-header bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="slds-media">
            <div className="slds-media__body">
              <h1 className="slds-page-header__title text-2xl font-bold text-blue-800">
                SmartCall MVP
              </h1>
              <p className="slds-text-body_small text-gray-600">
                リアルタイム音声認識AIサポートシステム
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="slds-text-heading_large mb-6">
            AIがサポートする<br />
            次世代コールセンターシステム
          </h2>
          <p className="slds-text-body_regular text-gray-600 max-w-2xl mx-auto mb-8">
            リアルタイム音声認識とAI支援により、オペレーターの応対品質向上と業務効率化を実現します。
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="slds-card p-6 text-center">
            <Phone className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="slds-text-heading_small mb-2">リアルタイム通話</h3>
            <p className="slds-text-body_small text-gray-600">
              WebRTC技術を使用したクリアで安定した音声通話
            </p>
          </div>
          
          <div className="slds-card p-6 text-center">
            <Headphones className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="slds-text-heading_small mb-2">音声認識</h3>
            <p className="slds-text-body_small text-gray-600">
              Google Speech-to-Textによる高精度なリアルタイム文字起こし
            </p>
          </div>
          
          <div className="slds-card p-6 text-center">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="slds-text-heading_small mb-2">AI支援</h3>
            <p className="slds-text-body_small text-gray-600">
              Gemini AIによる応答提案と知識検索でオペレーターをサポート
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="slds-text-heading_medium mb-8">今すぐ体験してみましょう</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/call" 
              className="slds-button slds-button_brand slds-button_stretch sm:slds-button_neutral"
              style={{ 
                backgroundColor: '#10B981',
                borderColor: '#10B981',
                minWidth: '200px'
              }}
            >
              <Phone className="mr-2" size={20} />
              お客様として通話する
            </Link>
            
            <Link 
              href="/operator"
              className="slds-button slds-button_outline-brand slds-button_stretch sm:slds-button_neutral"
              style={{ 
                borderColor: '#3B82F6',
                color: '#3B82F6',
                minWidth: '200px'
              }}
            >
              <Headphones className="mr-2" size={20} />
              オペレーター画面を見る
            </Link>
          </div>
          
          <p className="slds-text-body_small text-gray-500 mt-4">
            ※ デモ環境です。実際の通話には接続されません。
          </p>
        </div>

        {/* System Requirements */}
        <div className="mt-16 p-6 bg-blue-50 rounded-lg">
          <h4 className="slds-text-heading_small mb-4">システム要件</h4>
          <ul className="slds-text-body_small space-y-1">
            <li>• Chrome、Edge、Safariの最新版</li>
            <li>• マイクへのアクセス許可</li>
            <li>• 安定したインターネット接続</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="slds-text-body_small">
            © 2025 SmartCall MVP - AI-Powered Call Center Solution
          </p>
        </div>
      </footer>
    </div>
  )
}
