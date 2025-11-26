// Pre-cached filler audio for instant playback during thinking time
// Generated using ElevenLabs voice ID: Tx7VLgfksXHVnoY6jDGU
// These play immediately while the main TTS response is being generated

export interface FillerAudio {
  text: string;
  audio: string; // base64 encoded MP3
}

// Note: These base64 strings will be populated by running the generate-filler-audio edge function
// For now, they contain placeholder empty strings
export const CLEO_FILLER_AUDIO: FillerAudio[] = [
  { 
    text: "Okay, let's see...", 
    audio: "" // To be populated
  },
  { 
    text: "Alright, looking at your answer...", 
    audio: "" // To be populated
  },
  { 
    text: "Hmm, let me think about that...", 
    audio: "" // To be populated
  },
  { 
    text: "Right, so...", 
    audio: "" // To be populated
  },
  { 
    text: "Okay, so...", 
    audio: "" // To be populated
  },
];

export const getRandomFiller = (): FillerAudio => {
  const index = Math.floor(Math.random() * CLEO_FILLER_AUDIO.length);
  return CLEO_FILLER_AUDIO[index];
};
