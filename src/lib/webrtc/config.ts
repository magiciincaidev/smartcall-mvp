export const webRTCConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302'
    },
    // Add TURN server if configured
    ...(process.env.NEXT_PUBLIC_TURN_SERVER ? [{
      urls: process.env.NEXT_PUBLIC_TURN_SERVER,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
    }] : [])
  ],
  iceCandidatePoolSize: 10,
}

export const mediaConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1
  },
  video: false
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null

  async initialize() {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(webRTCConfig)
      
      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })
      
      // Handle remote stream
      this.remoteStream = new MediaStream()
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream!.addTrack(track)
        })
      }
      
      // Create data channel for signaling
      this.dataChannel = this.peerConnection.createDataChannel('signaling')
      
      return true
    } catch (error) {
      console.error('WebRTC initialization failed:', error)
      return false
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null
    
    try {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error('Failed to create offer:', error)
      return null
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null
    
    try {
      await this.peerConnection.setRemoteDescription(offer)
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      return answer
    } catch (error) {
      console.error('Failed to create answer:', error)
      return null
    }
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return
    
    try {
      await this.peerConnection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Failed to set remote answer:', error)
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return
    
    try {
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Failed to add ICE candidate:', error)
    }
  }

  getLocalStream() {
    return this.localStream
  }

  getRemoteStream() {
    return this.remoteStream
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    
    if (this.peerConnection) {
      this.peerConnection.close()
    }
    
    this.localStream = null
    this.remoteStream = null
    this.peerConnection = null
    this.dataChannel = null
  }
}