import React, { useEffect } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

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
  const { RiveComponent, rive } = useRive({
    src: '/src/assets/rive/cleo-avatar.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  // Get state machine inputs
  const speakingInput = useStateMachineInput(rive, 'State Machine 1', 'talking');
  const listeningInput = useStateMachineInput(rive, 'State Machine 1', 'listening');
  const mutedInput = useStateMachineInput(rive, 'State Machine 1', 'muted');

  // Update animation states based on props
  useEffect(() => {
    if (speakingInput) {
      speakingInput.value = isSpeaking;
    }
  }, [isSpeaking, speakingInput]);

  useEffect(() => {
    if (listeningInput) {
      listeningInput.value = isListening;
    }
  }, [isListening, listeningInput]);

  useEffect(() => {
    if (mutedInput) {
      mutedInput.value = isMuted;
    }
  }, [isMuted, mutedInput]);

  // Size mapping
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-[120px] h-[120px]',
  };

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
      <RiveComponent />
    </div>
  );
};

export default CleoAvatar;
