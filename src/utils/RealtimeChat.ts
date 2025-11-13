import { supabase } from '@/integrations/supabase/client';

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private conversationId: string | null = null;
  private microphoneId?: string;
  private speakerId?: string;
  private localStream: MediaStream | null = null;
  private isMuted: boolean = false;

  constructor(
    private onMessage: (event: any) => void,
    microphoneId?: string,
    speakerId?: string
  ) {
    this.microphoneId = microphoneId;
    this.speakerId = speakerId;
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(
    conversationId?: string, 
    lessonPlanId?: string, 
    topic?: string, 
    yearGroup?: string
  ) {
    try {
      console.log("🔗 Initializing WebRTC connection...");

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
            yearGroup
          }
        }
      );

      if (tokenError || !tokenData?.client_secret) {
        console.error("Token error:", tokenError);
        throw new Error(tokenError?.message || 'Failed to get ephemeral token');
      }

      console.log("✅ Ephemeral token received");
      this.conversationId = tokenData.conversationId;
      const ephemeralKey = tokenData.client_secret;

      // Create RTCPeerConnection
      console.log("🌐 Creating RTCPeerConnection...");
      this.pc = new RTCPeerConnection();

      // Set up remote audio playback
      this.pc.ontrack = async (e) => {
        console.log("🔊 Received remote audio track");
        this.audioEl.srcObject = e.streams[0];
        
        // Set speaker device if specified
        if (this.speakerId && 'setSinkId' in this.audioEl) {
          try {
            await (this.audioEl as any).setSinkId(this.speakerId);
            console.log("✅ Audio output set to:", this.speakerId);
          } catch (err) {
            console.error("Failed to set speaker device:", err);
          }
        }
      };

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
        
        // Trigger Cleo to speak first after brief delay
        setTimeout(() => {
          if (this.dc?.readyState === 'open') {
            console.log("🎬 Triggering initial response...");
            this.dc.send(JSON.stringify({ type: 'response.create' }));
          }
        }, 500);
      });

      this.dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
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
      const model = "gpt-4o-realtime-preview-2024-10-01";
      
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
        lessonPlan: tokenData.lessonPlan
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

  disconnect() {
    console.log("🔌 Disconnecting WebRTC...");
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

    if (this.audioEl.srcObject) {
      const stream = this.audioEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.audioEl.srcObject = null;
    }

    console.log("✅ Cleanup complete");
  }
}
