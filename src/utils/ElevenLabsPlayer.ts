export class ElevenLabsPlayer {
  private audioContext: AudioContext;
  private queue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.onSpeakingChange = onSpeakingChange;
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

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.onSpeakingChange?.(false);
  }

  getIsSpeaking(): boolean {
    return this.isPlaying;
  }
}
