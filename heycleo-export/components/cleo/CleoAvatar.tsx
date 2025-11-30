import React, { useEffect, useState, useRef } from 'react';
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
  const talk = useStateMachineInput(rive, 'avatar', 'Talk');
  const talk2 = useStateMachineInput(rive, 'avatar', 'Talk2');
  
  // Track previous state for trigger inputs
  const prevStateRef = useRef({ isSpeaking: false, isListening: false });

  // Debug: Log Rive instance and state machines
  useEffect(() => {
    if (rive) {
      console.log('🎭 Rive instance:', rive);
      console.log('🔍 Rive object keys:', Object.keys(rive));
      console.log('🎬 Available state machines:', rive.stateMachineNames);
      
      // Try to access state machine inputs
      try {
        if (typeof rive.stateMachineInputs === 'function') {
          const inputs = rive.stateMachineInputs('avatar');
          console.log('📊 State Machine Inputs (via method):', inputs);
          
          // Extract and log each input's name
          console.log('📝 Input Names:');
          inputs.forEach((input, index) => {
            console.log(`  Input ${index}:`, {
              name: input.name,
              type: input.type,
              value: input.value
            });
          });
        }
      } catch (e) {
        console.log('⚠️ Could not access stateMachineInputs method:', e);
      }

      // Log all properties that might contain input info
      console.log('🔍 Rive properties:', {
        stateMachineNames: rive.stateMachineNames,
        animationNames: rive.animationNames,
        // @ts-ignore - exploring the object
        stateMachines: rive.stateMachines,
        // @ts-ignore
        inputs: rive.inputs,
      });

      console.log('📊 Current input status:', {
        talk: talk ? 'found' : 'NOT FOUND',
        talk2: talk2 ? 'found' : 'NOT FOUND',
      });
    }
  }, [rive, talk, talk2]);

  // Update animation states - handle trigger inputs
  useEffect(() => {
    if (!talk || !talk2) {
      console.warn('⚠️ Rive inputs missing:', { hasTalk: !!talk, hasTalk2: !!talk2 });
      return;
    }

    // Detect trigger vs boolean inputs
    const isTriggerMode = typeof (talk as any).fire === 'function' || talk.value === undefined;
    
    if (isTriggerMode) {
      const prev = prevStateRef.current;

      // Fire only on transitions
      if (isSpeaking && !prev.isSpeaking) {
        console.log('🗣️ Firing Talk trigger (speaking start)');
        (talk as any).fire?.();
      } else if (!isSpeaking && isListening && (!prev.isListening || prev.isSpeaking)) {
        console.log('👂 Firing Talk2 trigger (listening start)');
        (talk2 as any).fire?.();
      } else if (!isSpeaking && !isListening && (prev.isSpeaking || prev.isListening)) {
        console.log('😌 Firing Talk2 trigger (return to idle)');
        (talk2 as any).fire?.();
      }

      prevStateRef.current = { isSpeaking, isListening };
    } else {
      // Boolean/number inputs fallback
      talk.value = !!isSpeaking;
      talk2.value = !isSpeaking && (isListening || true);
      console.log('🎚️ Boolean mode:', { talk: talk.value, talk2: talk2.value });
    }
  }, [isSpeaking, isListening, talk, talk2]);

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
