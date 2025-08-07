import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Sparkles, AlertTriangle, Lightbulb, Copy, CheckCircle } from 'lucide-react'

interface AIAssistantPanelProps {
  sessionId: string
}

interface Suggestion {
  id: string
  text: string
  category: 'response' | 'info' | 'alert'
  confidence: number
}

export default function AIAssistantPanel({ sessionId }: AIAssistantPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [relevantInfo, setRelevantInfo] = useState<any[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Subscribe to AI suggestions
    const channel = supabase
      .channel(`ai-assist-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_suggestions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const suggestion = payload.new
          setSuggestions(prev => [
            {
              id: suggestion.id,
              text: suggestion.suggestion,
              category: 'response',
              confidence: 0.85
            },
            ...prev.slice(0, 2) // Keep only last 3 suggestions
          ])
        }
      )
      .subscribe()

    // Simulate AI suggestions for demo
    simulateAISuggestions()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const simulateAISuggestions = () => {
    // Demo suggestions
    setTimeout(() => {
      setSuggestions([
        {
          id: '1',
          text: 'お問い合わせありがとうございます。どのようなご用件でしょうか？',
          category: 'response',
          confidence: 0.92
        },
        {
          id: '2',
          text: '商品についてのご質問でしょうか？それともサポートが必要でしょうか？',
          category: 'response',
          confidence: 0.87
        },
        {
          id: '3',
          text: '少々お待ちください。お調べいたします。',
          category: 'response',
          confidence: 0.85
        }
      ])

      setRelevantInfo([
        {
          id: '1',
          title: '製品マニュアル',
          content: '最新の製品マニュアルはこちらをご参照ください。',
          link: '#'
        },
        {
          id: '2',
          title: 'FAQ: よくある質問',
          content: '返品・交換に関するポリシー',
          link: '#'
        }
      ])
    }, 2000)
  }

  const copySuggestion = async (suggestion: Suggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.text)
      setCopiedId(suggestion.id)
      
      // Mark as used in database
      await supabase
        .from('ai_suggestions')
        .update({ used: true })
        .eq('id', suggestion.id)
      
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const generateNewSuggestions = async () => {
    setIsLoading(true)
    // TODO: Call Gemini API to generate new suggestions
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Demo: Add new suggestions
    setSuggestions([
      {
        id: Date.now().toString(),
        text: 'かしこまりました。確認させていただきます。',
        category: 'response',
        confidence: 0.88
      },
      ...suggestions.slice(0, 2)
    ])
    
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Response Suggestions */}
      <div className="slds-card p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="slds-text-heading_small flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" />
            応答提案
          </h3>
          <button
            onClick={generateNewSuggestions}
            disabled={isLoading}
            className="slds-button slds-button_neutral slds-button_small"
          >
            {isLoading ? '生成中...' : '再生成'}
          </button>
        </div>
        
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => copySuggestion(suggestion)}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm flex-1">{suggestion.text}</p>
                <button className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedId === suggestion.id ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                信頼度: {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relevant Information */}
      <div className="slds-card p-3">
        <h3 className="slds-text-heading_small flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-blue-500" />
          関連情報
        </h3>
        
        <div className="space-y-2">
          {relevantInfo.map((info) => (
            <div key={info.id} className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-sm">{info.title}</div>
              <div className="text-xs text-gray-600 mt-1">{info.content}</div>
              <a href={info.link} className="text-xs text-blue-600 hover:underline">
                詳細を見る →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="slds-card p-3 bg-yellow-50">
          <h3 className="slds-text-heading_small flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-600" />
            注意事項
          </h3>
          <ul className="space-y-1">
            {alerts.map((alert, index) => (
              <li key={index} className="text-sm text-yellow-800">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="slds-card p-3">
        <h3 className="slds-text-heading_small mb-2">クイックアクション</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="slds-button slds-button_neutral slds-button_small">
            FAQ検索
          </button>
          <button className="slds-button slds-button_neutral slds-button_small">
            過去履歴
          </button>
          <button className="slds-button slds-button_neutral slds-button_small">
            エスカレーション
          </button>
          <button className="slds-button slds-button_neutral slds-button_small">
            メモ追加
          </button>
        </div>
      </div>
    </div>
  )
}