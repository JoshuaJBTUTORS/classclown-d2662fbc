import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { CleoVoiceChat } from './CleoVoiceChat';
import { ContentEvent } from '@/types/lessonContent';

interface CleoVoiceChatWithRefProps {
  conversationId?: string;
  topic?: string;
  yearGroup?: string;
  onConversationCreated?: (id: string) => void;
  onContentEvent?: (event: ContentEvent) => void;
  onConnectionStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'disconnected') => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export interface CleoVoiceChatHandle {
  connect: () => void;
  disconnect: () => void;
}

export const CleoVoiceChatWithRef = forwardRef<CleoVoiceChatHandle, CleoVoiceChatWithRefProps>((props, ref) => {
  const connectFnRef = useRef<(() => void) | null>(null);
  const disconnectFnRef = useRef<(() => void) | null>(null);

  // Store connect/disconnect functions from child
  const handleConnectionStateChange = (state: 'idle' | 'connecting' | 'connected' | 'disconnected') => {
    props.onConnectionStateChange?.(state);
  };

  useImperativeHandle(ref, () => ({
    connect: () => {
      // Trigger connection through a different mechanism
      // Since CleoVoiceChat doesn't expose these methods, we need a different approach
      console.log('Connect called via ref');
    },
    disconnect: () => {
      console.log('Disconnect called via ref');
    },
  }));

  return <CleoVoiceChat {...props} onConnectionStateChange={handleConnectionStateChange} />;
});

CleoVoiceChatWithRef.displayName = 'CleoVoiceChatWithRef';
