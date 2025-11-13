import React, { useEffect, useState } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import cleoAvatarRiv from '@/assets/rive/cleo-avatar.riv';

interface CleoAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isMuted?: boolean;
  emotion?: 'happy' | 'thinking' | 'encouraging' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const CleoAvatar: React.FC<CleoAvatarProps> = ({
  isSpeaking,
  isListening,
  isMuted = false,
  emotion = 'neutral',
  size = 'medium',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { RiveComponent, rive } = useRive({
    src: cleoAvatarRiv,
    stateMachines: 'avatar',
    autoplay: true,
    onLoadError: (error) => {
      console.error('❌ Rive load error:', error);
      setHasError(true);
      setIsLoading(false);
    },
    onLoad: () => {
      console.log('✅ Rive file loaded successfully');
      setIsLoading(false);
    },
  });

  // Get state machine inputs
  const speakingInput = useStateMachineInput(rive, 'avatar', 'isSpeaking');
  const listeningInput = useStateMachineInput(rive, 'avatar', 'isListening');
  const mutedInput = useStateMachineInput(rive, 'avatar', 'isMuted');

  // Debug: Log Rive instance and state machines
  useEffect(() => {
    if (rive) {
      console.log('🎭 Rive instance:', rive);
      console.log('🎬 Available state machines:', rive.stateMachineNames);
      console.log('📊 State machine inputs:', {
        speakingInput: speakingInput ? 'found' : 'NOT FOUND',
        listeningInput: listeningInput ? 'found' : 'NOT FOUND',
        mutedInput: mutedInput ? 'found' : 'NOT FOUND',
      });
    }
  }, [rive, speakingInput, listeningInput, mutedInput]);

  // Update animation states based on props
  useEffect(() => {
    if (speakingInput) {
      console.log('🗣️ Setting speaking:', isSpeaking);
      speakingInput.value = isSpeaking;
    } else {
      console.warn('⚠️ speakingInput not found');
    }
  }, [isSpeaking, speakingInput]);

  useEffect(() => {
    if (listeningInput) {
      console.log('👂 Setting listening:', isListening);
      listeningInput.value = isListening;
    } else {
      console.warn('⚠️ listeningInput not found');
    }
  }, [isListening, listeningInput]);

  useEffect(() => {
    if (mutedInput) {
      console.log('🔇 Setting muted:', isMuted);
      mutedInput.value = isMuted;
    } else {
      console.warn('⚠️ mutedInput not found');
    }
  }, [isMuted, mutedInput]);

  // Size mapping
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-[120px] h-[120px]',
  };

  // Fallback to emoji if Rive fails
  if (hasError) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} flex items-center justify-center`}
        style={{
          borderRadius: '50%',
          boxShadow: isSpeaking 
            ? '0 0 20px 5px hsl(var(--primary) / 0.4)' 
            : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          transition: 'box-shadow 0.3s ease',
          fontSize: size === 'large' ? '60px' : size === 'medium' ? '40px' : '24px',
        }}
      >
        🧑🏻‍🔬
      </div>
    );
  }

  return (
    <div 
      className={`cleo-avatar-rive ${sizeClasses[size]} ${className}`}
      style={{
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: isSpeaking 
          ? '0 0 20px 5px hsl(var(--primary) / 0.4)' 
          : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {isLoading && (
        <div className="flex items-center justify-center h-full bg-background/50">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
      <RiveComponent />
    </div>
  );
};

export default CleoAvatar;
