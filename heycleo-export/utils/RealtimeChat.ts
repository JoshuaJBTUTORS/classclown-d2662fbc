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
  private previousSpeed: number = 0.90;
  private sessionConfigured: boolean = false;
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
    if (this.pc && this.pc.connectionState !== 'closed') {
      console.warn('⚠️ WebRTC connection already exists, cleaning up first...');
      this.cleanup();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      console.log("🔗 Initializing WebRTC connection...");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Get ephemeral token from edge function
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
        throw new Error(tokenError?.message || 'Failed to get ephemeral token');
      }

      this.conversationId = tokenData.conversationId;
      this.sessionStartTime = new Date();
      const ephemeralKey = tokenData.client_secret;

      // Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState as WebRTCConnectionState;
        console.log(`🔌 WebRTC connection state: ${state}`);
        this.onConnectionStateChange?.(state);
      };

      // Add local audio track from microphone
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

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        console.log("✅ Data channel opened");
        
        // Send session configuration
        this.dc!.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ["text"],
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
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        }));
      });

      this.dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          
          if (event.type === 'session.updated') {
            this.sessionConfigured = true;
            if (this.dc?.readyState === 'open') {
              this.dc.send(JSON.stringify({ type: 'response.create' }));
            }
            return;
          }
          
          this.onMessage(event);
        } catch (err) {
          console.error("Error parsing data channel message:", err);
        }
      });

      // Create offer and connect
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

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
        throw new Error(`Failed to connect to OpenAI: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      return {
        conversationId: this.conversationId,
        lessonPlan: tokenData.lessonPlan,
        currentStage: tokenData.currentStage
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
    if (!this.dc || this.dc.readyState !== 'open') return;
    this.dc.send(JSON.stringify(event));
  }

  cancelResponse() {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify({ type: 'response.cancel' }));
    }
  }

  mute() {
    this.localStream?.getAudioTracks().forEach(track => track.enabled = false);
    this.isMuted = true;
  }

  unmute() {
    this.localStream?.getAudioTracks().forEach(track => track.enabled = true);
    this.isMuted = false;
  }

  toggleMute(): boolean {
    if (this.isMuted) this.unmute();
    else this.mute();
    return this.isMuted;
  }

  getMuteState(): boolean {
    return this.isMuted;
  }

  async disconnect(wasInterrupted: boolean = false) {
    console.log("🔌 Disconnecting WebRTC...");
    // Log session before cleanup
    this.cleanup();
  }

  private cleanup() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.sessionStartTime = null;
    this.conversationId = null;
  }
}
