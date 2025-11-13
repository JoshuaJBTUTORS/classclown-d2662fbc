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

  // Get state machine inputs (talk = energetic, talk2 = calm)
  const talkInput = useStateMachineInput(rive, 'avatar', 'talk');
  const talk2Input = useStateMachineInput(rive, 'avatar', 'talk2');

  // Debug: Log Rive instance and state machines
  useEffect(() => {
    if (rive) {
      console.log('🎭 Rive instance:', rive);
      console.log('🎬 Available state machines:', rive.stateMachineNames);
      console.log('📊 State machine inputs:', {
        talkInput: talkInput ? 'found' : 'NOT FOUND',
        talk2Input: talk2Input ? 'found' : 'NOT FOUND',
      });
    }
  }, [rive, talkInput, talk2Input]);

  // Update animation states based on props
  // talk = energetic (when speaking), talk2 = calm (when listening/idle)
  useEffect(() => {
    if (talkInput && talk2Input) {
      if (isSpeaking) {
        console.log('🗣️ Setting talk (energetic):', true);
        talkInput.value = true;
        talk2Input.value = false;
      } else if (isListening) {
        console.log('👂 Setting talk2 (calm/listening):', true);
        talkInput.value = false;
        talk2Input.value = true;
      } else {
        // Idle/neutral - use calm animation
        talkInput.value = false;
        talk2Input.value = true;
      }
    } else {
      console.warn('⚠️ talk or talk2 input not found');
    }
  }, [isSpeaking, isListening, talkInput, talk2Input]);

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
