export class ElevenLabsPlayer {
  private audioContext: AudioContext;
  private queue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private isPlayingFiller: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextPlayTime: number = 0;
  private sentenceQueue: Array<{ text: string; voiceId: string; speed: number }> = [];
  private isProcessingQueue: boolean = false;
  private pcmByteBuffer: Uint8Array = new Uint8Array(0);
  private scheduledSources: AudioBufferSourceNode[] = [];
  private abortController: AbortController | null = null;
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private isFirstChunk: boolean = true;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.onSpeakingChange = onSpeakingChange;
    
    this.audioContext.resume().then(() => {
      console.log('🔊 AudioContext pre-warmed');
      if (this.nextPlayTime === 0) {
        this.nextPlayTime = this.audioContext.currentTime;
      }
    });
  }

  async resume(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (e) {}
      this.currentSource = null;
    }
    
    for (const source of this.scheduledSources) {
      try { source.stop(); } catch (e) {}
    }
    this.scheduledSources = [];
    
    this.queue = [];
    this.isPlaying = false;
    this.sentenceQueue = [];
    this.isProcessingQueue = false;
    this.nextPlayTime = 0;
    this.pcmByteBuffer = new Uint8Array(0);
    this.isFirstChunk = true;
    this.onSpeakingChange?.(false);
  }

  getIsSpeaking(): boolean {
    return this.isPlaying;
  }

  async playStreamingAudio(text: string, voiceId: string, speed: number = 1.0): Promise<void> {
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (this.nextPlayTime === 0) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
    
    this.sentenceQueue.push({ text, voiceId, speed });
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.sentenceQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
    
    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime <= currentTime || this.nextPlayTime === 0) {
      this.nextPlayTime = currentTime;
    }
    
    while (this.sentenceQueue.length > 0) {
      const { text, voiceId, speed } = this.sentenceQueue.shift()!;
      await this.streamSingleSentence(text, voiceId, speed);
    }
    
    this.isProcessingQueue = false;
  }

  private async streamSingleSentence(text: string, voiceId: string, speed: number): Promise<void> {
    this.pcmByteBuffer = new Uint8Array(0);
    this.abortController = new AbortController();
    
    try {
      // NOTE: Update this URL with your Supabase project ID
      const response = await fetch(
        `https://YOUR_PROJECT_ID.supabase.co/functions/v1/elevenlabs-tts-stream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer YOUR_ANON_KEY`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voiceId, speed }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(event.substring(6));
            if (data.done) break;

            if (data.chunk) {
              const binaryString = atob(data.chunk);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              this.playPCMChunk(bytes);
            }
          } catch (parseError) {
            console.error('Error parsing SSE event:', parseError);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Streaming playback error:', error);
      this.onSpeakingChange?.(false);
    }
  }

  private pcmToAudioBuffer(pcmBytes: Uint8Array): AudioBuffer {
    const alignedBuffer = new ArrayBuffer(pcmBytes.byteLength);
    new Uint8Array(alignedBuffer).set(pcmBytes);
    const int16Array = new Int16Array(alignedBuffer);
    
    const audioBuffer = this.audioContext.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768;
    }
    
    return audioBuffer;
  }

  private playPCMChunk(incomingBytes: Uint8Array) {
    try {
      const combined = new Uint8Array(this.pcmByteBuffer.length + incomingBytes.length);
      combined.set(this.pcmByteBuffer, 0);
      combined.set(incomingBytes, this.pcmByteBuffer.length);
      
      const completeSampleBytes = Math.floor(combined.length / 2) * 2;
      if (completeSampleBytes === 0) {
        this.pcmByteBuffer = combined;
        return;
      }
      
      const toPlay = combined.slice(0, completeSampleBytes);
      this.pcmByteBuffer = combined.slice(completeSampleBytes);
      
      const audioBuffer = this.pcmToAudioBuffer(toPlay);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.scheduledSources.push(source);
      
      const currentTime = this.audioContext.currentTime;
      const minStartOffset = this.isFirstChunk ? 0.03 : 0;
      if (this.isFirstChunk) this.isFirstChunk = false;
      
      const startTime = Math.max(currentTime + minStartOffset, this.nextPlayTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
      
      source.onended = () => {
        const index = this.scheduledSources.indexOf(source);
        if (index > -1) this.scheduledSources.splice(index, 1);
        if (this.nextPlayTime <= this.audioContext.currentTime + 0.05) {
          this.onSpeakingChange?.(false);
        }
      };
      
      source.start(startTime);
      this.onSpeakingChange?.(true);
    } catch (error) {
      console.error('Error playing PCM chunk:', error);
    }
  }

  async playFillerAudio(base64Audio: string): Promise<void> {
    if (!base64Audio) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await this.audioContext.decodeAudioData(bytes.slice().buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.isPlayingFiller = true;
      this.onSpeakingChange?.(true);
      
      source.onended = () => {
        this.isPlayingFiller = false;
        this.onSpeakingChange?.(false);
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing filler audio:', error);
      this.isPlayingFiller = false;
      this.onSpeakingChange?.(false);
    }
  }
}
