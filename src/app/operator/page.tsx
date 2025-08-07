'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, PhoneMissed, User, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { WebRTCManager } from '@/lib/webrtc/config'
import ConversationLog from '@/components/dashboard/ConversationLog'
import AIAssistantPanel from '@/components/dashboard/AIAssistantPanel'
import CustomerInfo from '@/components/dashboard/CustomerInfo'

export default function OperatorDashboard() {
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [callDuration, setCallDuration] = useState(0)
  
  const webRTCRef = useRef<WebRTCManager | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Subscribe to incoming calls
    const callChannel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: 'status=eq.ringing'
        },
        (payload) => {
          console.log('Incoming call:', payload)
          setIncomingCall(payload.new)
          // Play incoming call sound
          const audio = new Audio('/sounds/incoming.mp3')
          audio.play()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(callChannel)
      if (webRTCRef.current) {
        webRTCRef.current.disconnect()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  const acceptCall = async () => {
    if (!incomingCall) return
    
    try {
      // Initialize WebRTC
      webRTCRef.current = new WebRTCManager()
      await webRTCRef.current.initialize()
      
      // Update session status
      const { data: session } = await supabase
        .from('call_sessions')
        .update({ 
          status: 'active',
          operator_id: 'operator-001' // TODO: Get actual operator ID
        })
        .eq('id', incomingCall.id)
        .select()
        .single()
      
      setActiveSession(session)
      setIncomingCall(null)
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Failed to accept call:', error)
    }
  }

  const rejectCall = async () => {
    if (!incomingCall) return
    
    await supabase
      .from('call_sessions')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', incomingCall.id)
    
    setIncomingCall(null)
  }

  const endCall = async () => {
    if (!activeSession) return
    
    // Update session status
    await supabase
      .from('call_sessions')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', activeSession.id)
    
    // Disconnect WebRTC
    if (webRTCRef.current) {
      webRTCRef.current.disconnect()
    }
    
    // Clear duration counter
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }
    
    setActiveSession(null)
    setCallDuration(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="slds-scope h-screen flex flex-col">
      {/* Header */}
      <header className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <h1 className="slds-page-header__title">
                    SmartCall オペレーターダッシュボード
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            {activeSession && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span className="slds-text-heading_small">{formatDuration(callDuration)}</span>
                </div>
                <button
                  onClick={endCall}
                  className="slds-button slds-button_destructive"
                >
                  <PhoneOff className="mr-2" size={20} />
                  通話終了
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="slds-modal__container">
            <div className="slds-modal__content p-8 text-center">
              <div className="incoming-call-ring inline-block mb-4">
                <Phone size={80} className="text-green-500" />
              </div>
              <h2 className="slds-text-heading_large mb-2">着信</h2>
              <p className="slds-text-heading_medium mb-2">{incomingCall.customer_name || '不明'}</p>
              <p className="slds-text-body_regular mb-6">{incomingCall.customer_phone}</p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={acceptCall}
                  className="slds-button slds-button_success"
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                  }}
                >
                  <Phone size={32} />
                </button>
                <button
                  onClick={rejectCall}
                  className="slds-button slds-button_destructive"
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    borderColor: '#EF4444'
                  }}
                >
                  <PhoneMissed size={32} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Column - Customer Info (20%) */}
        <div className="w-1/5 border-r bg-gray-50 p-4">
          <h2 className="slds-text-heading_small mb-4">
            <User className="inline-block mr-2" size={20} />
            顧客情報
          </h2>
          {activeSession ? (
            <CustomerInfo session={activeSession} />
          ) : (
            <p className="slds-text-body_regular text-gray-500">
              通話待機中...
            </p>
          )}
        </div>

        {/* Center Column - Conversation Log (50%) */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 p-4">
            <h2 className="slds-text-heading_small mb-4">会話ログ</h2>
            {activeSession ? (
              <ConversationLog sessionId={activeSession.id} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="slds-text-body_regular text-gray-500">
                  通話が開始されると、ここに会話が表示されます
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - AI Assistant (30%) */}
        <div className="w-3/10 border-l bg-blue-50 p-4" style={{ width: '30%' }}>
          <h2 className="slds-text-heading_small mb-4">
            <AlertCircle className="inline-block mr-2" size={20} />
            AIアシスタント
          </h2>
          {activeSession ? (
            <AIAssistantPanel sessionId={activeSession.id} />
          ) : (
            <p className="slds-text-body_regular text-gray-500">
              通話中にAIがサポートします
            </p>
          )}
        </div>
      </div>
    </div>
  )
}