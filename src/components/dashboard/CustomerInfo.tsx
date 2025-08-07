import { useState, useEffect } from 'react'
import { User, Phone, Clock, FileText } from 'lucide-react'

interface CustomerInfoProps {
  session: any
}

export default function CustomerInfo({ session }: CustomerInfoProps) {
  const [pastInteractions, setPastInteractions] = useState<any[]>([])

  useEffect(() => {
    // TODO: Fetch past interactions from database
    setPastInteractions([
      { id: 1, date: '2024-01-15', summary: '製品に関する問い合わせ' },
      { id: 2, date: '2024-01-10', summary: 'サポート依頼' }
    ])
  }, [session])

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="slds-card p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span className="font-semibold">{session.customer_name || 'ゲスト'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span className="text-sm">{session.customer_phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span className="text-sm">
              {new Date(session.started_at).toLocaleTimeString('ja-JP')}
            </span>
          </div>
        </div>
      </div>

      {/* Past Interactions */}
      <div className="slds-card p-3">
        <h3 className="slds-text-heading_small mb-2">
          <FileText className="inline-block mr-1" size={16} />
          過去の対応履歴
        </h3>
        {pastInteractions.length > 0 ? (
          <ul className="space-y-2">
            {pastInteractions.map(interaction => (
              <li key={interaction.id} className="text-sm border-b pb-2">
                <div className="font-medium">{interaction.date}</div>
                <div className="text-gray-600">{interaction.summary}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">履歴なし</p>
        )}
      </div>

      {/* Notes */}
      <div className="slds-card p-3">
        <h3 className="slds-text-heading_small mb-2">メモ</h3>
        <textarea
          className="slds-textarea w-full"
          rows={4}
          placeholder="顧客に関するメモを入力..."
        />
      </div>
    </div>
  )
}