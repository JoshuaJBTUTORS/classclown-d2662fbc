import { ModeRecommendation, ChatMode } from '@/types/cleoTypes';

const VOICE_WARNING_THRESHOLD = 3 * 60; // 3 minutes remaining

export const shouldSwitchToText = (
  remainingVoiceSeconds: number,
  currentMode: ChatMode
): boolean => {
  return currentMode === 'voice' && remainingVoiceSeconds <= 0;
};

export const shouldShowVoiceWarning = (
  remainingVoiceSeconds: number,
  currentMode: ChatMode
): boolean => {
  return (
    currentMode === 'voice' &&
    remainingVoiceSeconds > 0 &&
    remainingVoiceSeconds <= VOICE_WARNING_THRESHOLD
  );
};

export const getModeRecommendation = (
  remainingVoiceSeconds: number,
  currentMode: ChatMode,
  lastContentType?: string
): ModeRecommendation => {
  // Force text if voice budget exhausted
  if (remainingVoiceSeconds <= 0) {
    return {
      suggestedMode: 'text',
      reason: 'Voice time limit reached (15 minutes)',
      autoSwitch: true,
    };
  }

  // Suggest text for practice activities
  if (lastContentType === 'question' && currentMode === 'voice') {
    return {
      suggestedMode: 'text',
      reason: 'Practice questions work better in text mode',
      autoSwitch: false,
    };
  }

  // Suggest voice for explanations (if budget allows)
  if (
    lastContentType === 'explanation' &&
    currentMode === 'text' &&
    remainingVoiceSeconds > VOICE_WARNING_THRESHOLD
  ) {
    return {
      suggestedMode: 'voice',
      reason: 'Voice is great for explanations',
      autoSwitch: false,
    };
  }

  return {
    suggestedMode: currentMode,
    reason: 'Current mode is optimal',
    autoSwitch: false,
  };
};

export const formatVoiceTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
