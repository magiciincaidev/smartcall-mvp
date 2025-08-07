'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { WebRTCManager } from '@/lib/webrtc/config'

export default function CustomerCallPage() {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'active' | 'ended'>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const webRTCRef = useRef<WebRTCManager | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (webRTCRef.current) {
        webRTCRef.current.disconnect()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  const initiateCall = async () => {
    try {
      setCallStatus('connecting')
      
      // Initialize WebRTC
      webRTCRef.current = new WebRTCManager()
      const initialized = await webRTCRef.current.initialize()
      
      if (!initialized) {
        alert('マイクへのアクセスが必要です。ブラウザの設定を確認してください。')
        setCallStatus('idle')
        return
      }
      
      // Create call session in Supabase
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          customer_phone: '050-****-****',
          customer_name: 'ゲストユーザー',
          status: 'ringing'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Failed to create session:', error)
        setCallStatus('idle')
        return
      }
      
      setSessionId(session.id)
      setCallStatus('ringing')
      
      // Simulate operator accepting call after 3 seconds
      setTimeout(() => {
        startCall(session.id)
      }, 3000)
      
    } catch (error) {
      console.error('Call initiation failed:', error)
      setCallStatus('idle')
    }
  }

  const startCall = async (sessionId: string) => {
    // Update session status
    await supabase
      .from('call_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId)
    
    setCallStatus('active')
    
    // Start duration counter
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const endCall = async () => {
    // Update session status
    if (sessionId) {
      await supabase
        .from('call_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }
    
    // Disconnect WebRTC
    if (webRTCRef.current) {
      webRTCRef.current.disconnect()
    }
    
    // Clear duration counter
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }
    
    setCallStatus('ended')
    setCallDuration(0)
    
    // Reset to idle after 3 seconds
    setTimeout(() => {
      setCallStatus('idle')
      setSessionId(null)
    }, 3000)
  }

  const toggleMute = () => {
    if (webRTCRef.current) {
      const localStream = webRTCRef.current.getLocalStream()
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = isMuted
          setIsMuted(!isMuted)
        }
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="slds-scope min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="slds-card p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="slds-text-heading_large mb-8">SmartCall カスタマーサポート</h1>
          
          {callStatus === 'idle' && (
            <div>
              <p className="slds-text-body_regular mb-8">
                オペレーターにお繋ぎします
              </p>
              <button
                onClick={initiateCall}
                className="slds-button slds-button_brand slds-button_stretch call-button-pulse"
                style={{ 
                  height: '100px',
                  fontSize: '24px',
                  backgroundColor: '#10B981',
                  borderColor: '#10B981'
                }}
              >
                <Phone className="inline-block mr-3" size={40} />
                コールする
              </button>
            </div>
          )}
          
          {callStatus === 'connecting' && (
            <div>
              <div className="slds-spinner_container">
                <div role="status" className="slds-spinner slds-spinner_medium">
                  <span className="slds-assistive-text">接続中...</span>
                  <div className="slds-spinner__dot-a"></div>
                  <div className="slds-spinner__dot-b"></div>
                </div>
              </div>
              <p className="slds-text-body_regular mt-4">
                マイクへのアクセスを許可してください...
              </p>
            </div>
          )}
          
          {callStatus === 'ringing' && (
            <div>
              <div className="incoming-call-ring inline-block mb-4">
                <Phone size={80} className="text-green-500" />
              </div>
              <p className="slds-text-heading_medium">
                オペレーターにお繋ぎしています...
              </p>
              <audio src="/sounds/ring.mp3" autoPlay loop />
            </div>
          )}
          
          {callStatus === 'active' && (
            <div>
              <div className="mb-8">
                <p className="slds-text-body_small text-gray-500 mb-2">通話中</p>
                <p className="slds-text-heading_large">{formatDuration(callDuration)}</p>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`slds-button ${isMuted ? 'slds-button_neutral' : 'slds-button_brand'}`}
                  style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                >
                  {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                
                <button
                  onClick={endCall}
                  className="slds-button slds-button_destructive"
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    borderColor: '#EF4444'
                  }}
                >
                  <PhoneOff size={32} />
                </button>
              </div>
            </div>
          )}
          
          {callStatus === 'ended' && (
            <div>
              <p className="slds-text-heading_medium mb-4">
                通話が終了しました
              </p>
              <p className="slds-text-body_regular">
                ご利用ありがとうございました
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}