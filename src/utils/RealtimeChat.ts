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
  private sessionStartTime: Date | null = null;
  private previousSpeed: number = 0.80; // Track previous speed for dynamic acknowledgments
  private currentAssistantItemId: string | null = null; // Track current assistant message ID
  private audioStartTime: number | null = null; // Track when audio started playing

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
      this.sessionStartTime = new Date();
      const ephemeralKey = tokenData.client_secret;
      
      // Initialize previous speed from user's saved preference
      if (tokenData.voice_speed) {
        this.previousSpeed = tokenData.voice_speed;
      }

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
          
          // Track assistant item_id from response events
          if (event.type === 'response.output_item.added' && event.item?.role === 'assistant') {
            this.currentAssistantItemId = event.item.id;
            this.audioStartTime = Date.now();
            console.log('🎯 Tracking assistant item:', this.currentAssistantItemId);
          }
          
          // Also capture from audio delta events as backup
          if (event.type === 'response.audio.delta' && event.item_id) {
            if (this.currentAssistantItemId !== event.item_id) {
              this.currentAssistantItemId = event.item_id;
              this.audioStartTime = Date.now();
            }
          }
          
          // Clear tracking when response completes
          if (event.type === 'response.done') {
            this.currentAssistantItemId = null;
            this.audioStartTime = null;
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

  updateVoiceSpeed(speed: number) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('Data channel not ready, cannot update voice speed');
      return;
    }
    
    const direction = speed > this.previousSpeed ? 'faster' : 'slower';
    console.log(`🔊 Changing voice speed: ${this.previousSpeed} → ${speed} (${direction})`);
    
    // Step 1: Truncate current audio immediately (OpenAI's native mechanism)
    if (this.currentAssistantItemId) {
      const audioEndMs = this.audioStartTime 
        ? Math.floor(Date.now() - this.audioStartTime)
        : 0;
      
      console.log(`✂️ Truncating item ${this.currentAssistantItemId} at ${audioEndMs}ms`);
      
      this.dc.send(JSON.stringify({ 
        type: 'conversation.item.truncate',
        item_id: this.currentAssistantItemId,
        content_index: 0,
        audio_end_ms: audioEndMs
      }));
    }
    
    // Step 2: Cancel current response to stop server-side generation
    this.dc.send(JSON.stringify({ type: 'response.cancel' }));
    
    // Step 3: Update session with new speed
    this.dc.send(JSON.stringify({
      type: 'session.update',
      session: {
        output_audio_format: 'pcm16',
        modalities: ['text', 'audio'],
        voice: 'ballad',
        speed: speed
      }
    }));
    
    // Step 4: Send contextual acknowledgment message immediately
    const acknowledgmentMessage = direction === 'slower'
      ? "The student just slowed down the voice speed. Briefly and naturally acknowledge this (e.g., 'Okay, let me slow down for you' or 'No problem, I'll take it easier'), then smoothly continue where you left off."
      : "The student just sped up the voice speed. Briefly and naturally acknowledge this (e.g., 'Alright, let me pick up the pace' or 'Okay, let's kick this up a notch'), then smoothly continue where you left off.";
    
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: acknowledgmentMessage }]
      }
    }));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
    
    // Clear tracking since we're starting new response
    this.currentAssistantItemId = null;
    this.audioStartTime = null;
    
    this.previousSpeed = speed;
  }

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
