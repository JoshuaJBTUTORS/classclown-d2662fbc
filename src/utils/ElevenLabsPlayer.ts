export class ElevenLabsPlayer {
  private audioContext: AudioContext;
  private queue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private isPlayingFiller: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextPlayTime: number = 0;
  private sentenceQueue: Array<{ text: string; voiceId: string; speed: number }> = [];
  private isProcessingQueue: boolean = false;
  private pcmByteBuffer: Uint8Array = new Uint8Array(0); // Accumulate incomplete PCM bytes
  private scheduledSources: AudioBufferSourceNode[] = []; // Track all scheduled audio sources
  private abortController: AbortController | null = null; // Track ongoing fetch streams
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private isFirstChunk: boolean = true; // Track if this is the first chunk after connection

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.onSpeakingChange = onSpeakingChange;
    
    // Pre-warm: immediately request resume to satisfy autoplay policy
    // This starts the process early so it's ready when audio arrives
    this.audioContext.resume().then(() => {
      console.log('🔊 AudioContext pre-warmed, state:', this.audioContext.state);
      // Initialize nextPlayTime to current time once context is running
      if (this.nextPlayTime === 0) {
        this.nextPlayTime = this.audioContext.currentTime;
      }
    }).catch(err => {
      console.warn('AudioContext pre-warm failed:', err);
    });
  }

  async playAudio(base64Audio: string) {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Add to queue
      this.queue.push(bytes);

      // Start playing if not already
      if (!this.isPlaying) {
        await this.playNext();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onSpeakingChange?.(false);
      return;
    }

    this.isPlaying = true;
    this.onSpeakingChange?.(true);

    const audioData = this.queue.shift()!;

    try {
      // Decode MP3 audio - create a copy to avoid SharedArrayBuffer issues
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice().buffer);
      
      // Create source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      
      // Play next when done
      this.currentSource.onended = () => {
        this.playNext();
      };
      
      this.currentSource.start(0);
      console.log(`🔊 Playing audio (${audioBuffer.duration.toFixed(2)}s)`);

    } catch (error) {
      console.error('Error decoding audio:', error);
      // Continue with next chunk even if current fails
      this.playNext();
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🔊 AudioContext resumed');
    }
  }

  stop() {
    // Abort any ongoing fetch stream
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // Stop the legacy currentSource (from playNext)
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (e) { /* Already stopped */ }
      this.currentSource = null;
    }
    
    // Stop ALL scheduled streaming sources
    for (const source of this.scheduledSources) {
      try { source.stop(); } catch (e) { /* Already stopped */ }
    }
    this.scheduledSources = [];
    
    // Clear all queues and state
    this.queue = [];
    this.isPlaying = false;
    this.sentenceQueue = [];
    this.isProcessingQueue = false;
    this.nextPlayTime = 0;
    this.pcmByteBuffer = new Uint8Array(0);
    this.isFirstChunk = true; // Reset for next connection
    this.onSpeakingChange?.(false);
  }

  getIsSpeaking(): boolean {
    return this.isPlaying;
  }

  async playStreamingAudio(text: string, voiceId: string, speed: number = 1.0): Promise<void> {
    // CRITICAL: Wait for AudioContext to be fully running before proceeding
    if (this.audioContext.state !== 'running') {
      console.log('🔊 AudioContext not running, waiting for resume...');
      await this.audioContext.resume();
      
      // Small delay to let the context stabilize
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🔊 AudioContext now running, state:', this.audioContext.state);
    }
    
    // Initialize nextPlayTime if it's still 0 (first audio)
    if (this.nextPlayTime === 0) {
      this.nextPlayTime = this.audioContext.currentTime;
      console.log('🔊 Initialized nextPlayTime to:', this.nextPlayTime);
    }
    
    console.log(`🎙️ Adding "${text.substring(0, 30)}..." to sentence queue (speed: ${speed})`);
    this.sentenceQueue.push({ text, voiceId, speed });
    
    // If not already processing, start the queue
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.sentenceQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    // Ensure AudioContext is running before processing
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
    
    // Only reset nextPlayTime if no audio is scheduled ahead AND time base is valid
    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime <= currentTime || this.nextPlayTime === 0) {
      this.nextPlayTime = currentTime;
      console.log('🔊 Reset nextPlayTime to currentTime:', currentTime);
    }
    // Otherwise, keep nextPlayTime as-is - new audio will naturally queue after existing
    
    while (this.sentenceQueue.length > 0) {
      const { text, voiceId, speed } = this.sentenceQueue.shift()!;
      await this.streamSingleSentence(text, voiceId, speed); // AWAIT - ensures order!
    }
    
    this.isProcessingQueue = false;
  }

  private async streamSingleSentence(text: string, voiceId: string, speed: number): Promise<void> {
    // Reset byte buffer for fresh sentence
    this.pcmByteBuffer = new Uint8Array(0);
    
    // Create abort controller for this stream
    this.abortController = new AbortController();
    
    try {
      console.log(`🎙️ ====== ELEVENLABS PLAYER streamSingleSentence ======`);
      console.log(`🎙️ Text length: ${text.length} chars`);
      console.log(`🎙️ Speed parameter received: ${speed}`);
      console.log(`🎙️ Speed type: ${typeof speed}`);
      console.log(`🎙️ About to call edge function with speed: ${speed}`);
      
    const response = await fetch(
      `https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/elevenlabs-tts-stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd9PdQHfoG7oTnwA`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voiceId, speed }),
          signal: this.abortController.signal, // Add abort signal
        }
      );
      
      console.log(`🎙️ Edge function response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream complete');
          break;
        }

        // Decode incoming bytes and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (delimited by \n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(event.substring(6)); // Remove "data: " prefix
            
            if (data.done) {
              console.log('🎬 Stream marked as done');
              break;
            }

            if (data.chunk) {
              // Decode base64 to binary
              const binaryString = atob(data.chunk);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              // Play PCM chunk immediately - no decoding needed!
              this.playPCMChunk(bytes);
            }
          } catch (parseError) {
            console.error('Error parsing SSE event:', parseError);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('🛑 Stream aborted');
        return; // Clean exit on abort
      }
      console.error('Streaming playback error:', error);
      this.onSpeakingChange?.(false);
    }
  }

  // Convert raw PCM Int16 samples to playable AudioBuffer
  private pcmToAudioBuffer(pcmBytes: Uint8Array): AudioBuffer {
    // CRITICAL: Create aligned buffer copy
    // pcmBytes.buffer may be misaligned or larger than actual data
    const alignedBuffer = new ArrayBuffer(pcmBytes.byteLength);
    new Uint8Array(alignedBuffer).set(pcmBytes);
    
    // Now safely interpret as Int16 (2 bytes per sample)
    const int16Array = new Int16Array(alignedBuffer);
    
    // Create AudioBuffer at 24kHz (matching pcm_24000 format)
    const audioBuffer = this.audioContext.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768;
    }
    
    return audioBuffer;
  }

  // Play PCM chunk with byte boundary alignment for gapless playback
  private playPCMChunk(incomingBytes: Uint8Array) {
    try {
      // Combine with any leftover bytes from previous chunk
      const combined = new Uint8Array(this.pcmByteBuffer.length + incomingBytes.length);
      combined.set(this.pcmByteBuffer, 0);
      combined.set(incomingBytes, this.pcmByteBuffer.length);
      
      // Calculate complete samples (2 bytes each for Int16)
      const completeSampleBytes = Math.floor(combined.length / 2) * 2;
      
      // If we have no complete samples, just buffer and wait
      if (completeSampleBytes === 0) {
        this.pcmByteBuffer = combined;
        return;
      }
      
      // Extract complete samples to play
      const toPlay = combined.slice(0, completeSampleBytes);
      
      // Store leftover byte (0 or 1 byte) for next chunk
      this.pcmByteBuffer = combined.slice(completeSampleBytes);
      
      // Convert to audio buffer and play
      const audioBuffer = this.pcmToAudioBuffer(toPlay);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      // Track this source for cleanup
      this.scheduledSources.push(source);
      
      // CRITICAL: Ensure valid time base before scheduling
      const currentTime = this.audioContext.currentTime;
      
      // Add a tiny buffer (30ms) if this is the very first chunk
      // This gives the audio system time to fully initialize
      const minStartOffset = this.isFirstChunk ? 0.03 : 0;
      if (this.isFirstChunk) {
        console.log('🔊 First chunk detected, adding 30ms buffer');
        this.isFirstChunk = false;
      }
      
      const startTime = Math.max(currentTime + minStartOffset, this.nextPlayTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
      
      source.onended = () => {
        // Remove from tracking when done
        const index = this.scheduledSources.indexOf(source);
        if (index > -1) this.scheduledSources.splice(index, 1);
        
        // Only mark as not speaking if no more audio scheduled
        if (this.nextPlayTime <= this.audioContext.currentTime + 0.05) {
          this.onSpeakingChange?.(false);
        }
      };
      
      source.start(startTime);
      this.onSpeakingChange?.(true);
      
      console.log(`🔊 Scheduled PCM chunk (${audioBuffer.duration.toFixed(3)}s), buffered ${this.pcmByteBuffer.length} bytes`);
    } catch (error) {
      console.error('Error playing PCM chunk:', error);
    }
  }

  async playFillerAudio(base64Audio: string): Promise<void> {
    if (!base64Audio || base64Audio === '') {
      console.warn('⚠️ Empty filler audio, skipping');
      return;
    }

    // Resume AudioContext if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🔊 AudioContext resumed');
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode MP3 audio
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.slice().buffer);
      
      // Create source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      // Mark as playing filler
      this.isPlayingFiller = true;
      this.onSpeakingChange?.(true);
      
      // When filler ends, continue with queued audio
      source.onended = () => {
        console.log('🎭 Filler audio complete');
        this.isPlayingFiller = false;
        
        // If there's queued audio, start playing it
        if (this.queue.length > 0 && !this.isPlaying) {
          this.playNext();
        } else if (this.queue.length === 0) {
          // No queued audio yet, update speaking state
          this.onSpeakingChange?.(false);
        }
      };
      
      source.start(0);
      console.log(`🎭 Playing filler audio (${audioBuffer.duration.toFixed(2)}s)`);

    } catch (error) {
      console.error('Error playing filler audio:', error);
      this.isPlayingFiller = false;
      this.onSpeakingChange?.(false);
    }
  }
}
