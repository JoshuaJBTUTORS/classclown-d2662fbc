## Goal
Add voice input to Agent Cleo so users can speak, have it transcribed to text in the composer, then edit/send manually.

## Behaviour
- A mic button sits next to the send button in the Agent Cleo composer.
- Click mic → recording starts (button turns into a stop button with a pulsing state and a running timer, plus a cancel "✕").
- Click stop → shows a spinner while transcribing.
- Transcript is inserted into the existing textarea (appended if there's already text), textarea refocuses, cursor at end. Nothing is auto-sent — the user reviews and presses send.
- Errors (no mic permission, unsupported browser, transcription failure) show a toast and reset to idle.

## Technical details
- Reuse `src/utils/audioRecorder.ts` (`AudioRecorder`) — already used by `src/components/cleo/CleoInput.tsx`.
- Reuse the existing `voice-to-text` edge function (`supabase/functions/voice-to-text/index.ts`, OpenAI Whisper) — no backend changes needed.
- Changes are confined to `src/pages/AgentCleo.tsx`: local `recordingState` ('idle' | 'recording' | 'processing'), duration timer, recorder ref, cleanup on unmount, and the mic/stop/cancel buttons in the composer around line 825-838.
- Mic button is disabled while a reply is streaming (`loading`), matching the send button.
