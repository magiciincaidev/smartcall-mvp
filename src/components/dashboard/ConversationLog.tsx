import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Headphones } from 'lucide-react'

interface ConversationLogProps {
  sessionId: string
}

interface LogEntry {
  id: string
  speaker: 'customer' | 'operator'
  text: string
  timestamp: string
  confidence?: number
  isInterim?: boolean
}

export default function ConversationLog({ sessionId }: ConversationLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [interimText, setInterimText] = useState<string>('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch existing logs
    fetchLogs()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`conversation-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_logs',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newLog = payload.new as LogEntry
          setLogs(prev => [...prev, newLog])
          scrollToBottom()
        }
      )
      .on('broadcast', { event: 'interim_transcription' }, (payload) => {
        // Handle interim transcription results
        setInterimText(payload.payload.text)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('conversation_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (data) {
      setLogs(data)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div 
      ref={logContainerRef}
      className="conversation-log h-full overflow-y-auto p-4 bg-white rounded-lg shadow-inner"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex gap-3 ${
              log.speaker === 'operator' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              log.speaker === 'customer' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {log.speaker === 'customer' ? (
                <User size={16} className="text-blue-600" />
              ) : (
                <Headphones size={16} className="text-green-600" />
              )}
            </div>
            
            <div className={`flex-1 ${
              log.speaker === 'operator' ? 'text-right' : ''
            }`}>
              <div className="text-xs text-gray-500 mb-1">
                {log.speaker === 'customer' ? 'お客様' : 'オペレーター'}
                <span className="ml-2">{formatTime(log.timestamp)}</span>
                {log.confidence && (
                  <span className="ml-2 text-gray-400">
                    (信頼度: {Math.round(log.confidence * 100)}%)
                  </span>
                )}
              </div>
              <div className={`inline-block px-4 py-2 rounded-lg ${
                log.speaker === 'customer' 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'bg-green-50 text-green-900'
              }`}>
                {log.text}
              </div>
            </div>
          </div>
        ))}
        
        {/* Interim transcription */}
        {interimText && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">認識中...</div>
              <div className="inline-block px-4 py-2 rounded-lg bg-gray-50 text-gray-600 italic typing-animation">
                {interimText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}