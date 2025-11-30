import { supabase } from '@/integrations/supabase/client';

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private conversationId: string | null = null;
  private microphoneId?: string;
  private speakerId?: string;
  private localStream: MediaStream | null = null;
  private isMuted: boolean = false;
  private sessionStartTime: Date | null = null;
  private previousSpeed: number = 0.90; // Track previous speed
  private sessionConfigured: boolean = false; // Track if session.update was confirmed
  private onConnectionStateChange?: (state: WebRTCConnectionState) => void;

  constructor(
    private onMessage: (event: any) => void,
    microphoneId?: string,
    speakerId?: string,
    onConnectionStateChange?: (state: WebRTCConnectionState) => void
  ) {
    this.microphoneId = microphoneId;
    this.speakerId = speakerId;
    this.onConnectionStateChange = onConnectionStateChange;
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(
    conversationId?: string, 
    lessonPlanId?: string, 
    topic?: string, 
    yearGroup?: string,
    resumeState?: {
      isResuming: boolean;
      activeStep: number;
      visibleContentIds: string[];
      completedSteps: string[];
      lastStepTitle?: string;
      lastContentBlockId?: string;
    }
  ) {
    // Guard against duplicate connections
    if (this.pc && this.pc.connectionState !== 'closed') {
      console.warn('⚠️ WebRTC connection already exists, cleaning up first...');
      this.cleanup();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      console.log("🔗 Initializing WebRTC connection...");
      if (resumeState?.isResuming) {
        console.log("🔄 Resume mode - activeStep:", resumeState.activeStep, "lastStepTitle:", resumeState.lastStepTitle);
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Get ephemeral token from edge function
      console.log("📞 Requesting ephemeral token...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'cleo-realtime-session-token',
        {
          body: {
            token: session.access_token,
            conversationId,
            lessonPlanId,
            topic,
            yearGroup,
            resumeState
          }
        }
      );

      if (tokenError || !tokenData?.client_secret) {
        console.error("Token error:", tokenError);
        throw new Error(tokenError?.message || 'Failed to get ephemeral token');
      }

      console.log("✅ Ephemeral token received");
      this.conversationId = tokenData.conversationId;
      this.sessionStartTime = new Date();
      const ephemeralKey = tokenData.client_secret;
      
      // Initialize previous speed from user's saved preference
      if (tokenData.voice_speed) {
        this.previousSpeed = tokenData.voice_speed;
      }

      // Create RTCPeerConnection
      console.log("🌐 Creating RTCPeerConnection...");
      this.pc = new RTCPeerConnection();

      // Monitor connection health
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState as WebRTCConnectionState;
        console.log(`🔌 WebRTC connection state: ${state}`);
        this.onConnectionStateChange?.(state);
        
        if (state === 'disconnected') {
          console.warn('⚠️ Connection degraded - network may be weak');
        } else if (state === 'failed') {
          console.error('❌ Connection failed - network issue');
        }
      };
      
      // Monitor ICE connection (network layer)
      this.pc.oniceconnectionstatechange = () => {
        const iceState = this.pc?.iceConnectionState;
        console.log(`🧊 ICE connection state: ${iceState}`);
        
        if (iceState === 'disconnected') {
          console.warn('⚠️ ICE disconnected - possible network interruption');
        } else if (iceState === 'failed') {
          console.error('❌ ICE failed - network connection lost');
        }
      };

      // NO remote audio track - ElevenLabs handles TTS
      console.log("🔇 Audio output disabled (using ElevenLabs TTS)");

      // Add local audio track from microphone
      console.log("🎤 Requesting microphone access...");
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.microphoneId ? { exact: this.microphoneId } : undefined,
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioTrack = this.localStream.getTracks()[0];
      this.pc.addTrack(audioTrack, this.localStream);
      console.log("✅ Microphone track added");

      // Set up data channel for events
      console.log("📡 Creating data channel...");
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        console.log("✅ Data channel opened");
        
        // Send COMPLETE session configuration to avoid overwriting server settings
        console.log("⚙️ Sending complete session configuration...");
        this.dc!.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ["text"], // TEXT ONLY for ElevenLabs
            input_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1",
              language: "en"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.85,
              prefix_padding_ms: 1000,
              silence_duration_ms: 1000,
              create_response: true
            },
            input_audio_noise_reduction: {
              type: "near_field"
            },
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        }));
        
        // Wait for session.updated confirmation before triggering response
        console.log("⏳ Waiting for session.updated confirmation...");
      });

      this.dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          
          // Handle session.updated confirmation
          if (event.type === 'session.updated') {
            console.log("✅ Session configuration confirmed by OpenAI");
            this.sessionConfigured = true;
            
            // NOW trigger Cleo's initial response - settings are guaranteed active
            if (this.dc?.readyState === 'open') {
              console.log("🎬 Triggering initial response after config confirmation...");
              this.dc.send(JSON.stringify({ type: 'response.create' }));
            }
            return;
          }
          
          this.onMessage(event);
        } catch (err) {
          console.error("Error parsing data channel message:", err);
        }
      });

      this.dc.addEventListener("error", (err) => {
        console.error("❌ Data channel error:", err);
      });

      this.dc.addEventListener("close", () => {
        console.log("📡 Data channel closed");
      });

      // Create offer and set local description
      console.log("📝 Creating SDP offer...");
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      console.log("🚀 Connecting to OpenAI Realtime...");
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("SDP negotiation failed:", sdpResponse.status, errorText);
        throw new Error(`Failed to connect to OpenAI: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      await this.pc.setRemoteDescription(answer);
      console.log("✅ WebRTC connection established");

      return {
        conversationId: this.conversationId,
        lessonPlan: tokenData.lessonPlan,
        currentStage: tokenData.currentStage  // Pass through the stage from token response
      };

    } catch (error) {
      console.error("❌ WebRTC initialization failed:", error);
      this.cleanup();
      throw error;
    }
  }

  sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    console.log("💬 Sending text message:", text);
    
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));
    
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  sendEvent(event: any) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('Data channel not ready, cannot send event');
      return;
    }
    
    this.dc.send(JSON.stringify(event));
  }

  cancelResponse() {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify({ type: 'response.cancel' }));
      console.log('🛑 Sent response.cancel to OpenAI');
    }
  }

  mute() {
    if (!this.localStream) {
      console.warn('No local stream to mute');
      return;
    }
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = false;
    });
    
    this.isMuted = true;
    console.log('🔇 Microphone muted');
  }

  unmute() {
    if (!this.localStream) {
      console.warn('No local stream to unmute');
      return;
    }
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = true;
    });
    
    this.isMuted = false;
    console.log('🎤 Microphone unmuted');
  }

  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  getMuteState(): boolean {
    return this.isMuted;
  }

  // Voice speed not applicable with ElevenLabs (removed)

  private async logSession(wasInterrupted: boolean = false) {
    if (!this.sessionStartTime || !this.conversationId) {
      console.warn('⚠️ Cannot log session: missing start time or conversation ID');
      return;
    }

    const durationSeconds = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
    
    // Only log if session was at least 1 second
    if (durationSeconds < 1) {
      console.log('Session too short to log');
      return;
    }

    try {
      console.log(`📊 Logging voice session: ${durationSeconds}s`);
      
      // 🔐 Force refresh the auth session before logging
      // This ensures we have a valid token even after long lessons
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !session) {
        console.warn('⚠️ Could not refresh session, trying with current token...');
      }
      
      const { data, error } = await supabase.functions.invoke('log-voice-session', {
        body: {
          conversationId: this.conversationId,
          durationSeconds,
          wasInterrupted,
          sessionStart: this.sessionStartTime.toISOString()
        }
      });

      if (error) {
        console.error('Failed to log session:', error);
      } else {
        console.log('✅ Session logged:', data);
      }
    } catch (err) {
      console.error('Error logging session:', err);
    }
  }

  async disconnect(wasInterrupted: boolean = false) {
    console.log("🔌 Disconnecting WebRTC...");
    await this.logSession(wasInterrupted);
    this.cleanup();
  }

  private cleanup() {
    console.log('🧹 Starting WebRTC cleanup...');
    
    if (this.dc) {
      console.log('📡 Closing data channel...');
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      console.log('🌐 Closing RTCPeerConnection...');
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      console.log('🎤 Stopping microphone tracks...');
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`  ✓ Stopped track: ${track.kind}`);
      });
      this.localStream = null;
    }

    if (this.audioEl.srcObject) {
      console.log('🔊 Stopping audio playback tracks...');
      const stream = this.audioEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`  ✓ Stopped track: ${track.kind}`);
      });
      this.audioEl.srcObject = null;
    }

    this.sessionStartTime = null;
    this.conversationId = null;

    console.log("✅ WebRTC cleanup complete - all connections closed");
  }
}
