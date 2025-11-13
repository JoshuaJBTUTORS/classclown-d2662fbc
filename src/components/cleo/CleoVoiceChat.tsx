import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeChat';
import { supabase } from '@/integrations/supabase/client';
import { ContentEvent } from '@/types/lessonContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CleoVoiceChatProps {
  conversationId?: string;
  topic?: string;
  yearGroup?: string;
  lessonPlan?: {
    id?: string;
    topic: string;
    year_group: string;
    learning_objectives: string[];
    teaching_sequence: Array<{
      id: string;
      title: string;
      duration_minutes?: number;
    }>;
  };
  onConversationCreated?: (id: string) => void;
  onContentEvent?: (event: ContentEvent) => void;
  onConnectionStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'disconnected') => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onProvideControls?: (controls: { connect: () => void; disconnect: () => void; sendUserMessage: (text: string) => void }) => void;
  voiceTimer?: {
    start: () => void;
    pause: () => void;
    hasReachedLimit: boolean;
  };
  onVoiceLimitReached?: () => void;
  selectedMicrophoneId?: string;
  selectedSpeakerId?: string;
}

export const CleoVoiceChat: React.FC<CleoVoiceChatProps> = ({ 
  conversationId,
  topic,
  yearGroup,
  lessonPlan,
  onConversationCreated,
  onContentEvent,
  onConnectionStateChange,
  onListeningChange,
  onSpeakingChange,
  onProvideControls,
  voiceTimer,
  onVoiceLimitReached,
  selectedMicrophoneId,
  selectedSpeakerId
}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const rtcRef = useRef<RealtimeChat | null>(null);
  const currentConversationId = useRef<string | undefined>(conversationId);
  const reconnectionAttemptsRef = useRef(0);
  const maxReconnectionAttempts = 3;
  const isReconnectingRef = useRef(false);

  // Notify parent of state changes
  useEffect(() => {
    onConnectionStateChange?.(connectionState);
  }, [connectionState, onConnectionStateChange]);

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  // Provide connect/disconnect controls to parent
  useEffect(() => {
    onProvideControls?.({ connect, disconnect, sendUserMessage });
  }, [onProvideControls]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const attemptReconnection = async () => {
    if (isReconnectingRef.current) return;
    if (reconnectionAttemptsRef.current >= maxReconnectionAttempts) {
      toast({
        title: "Connection Lost",
        description: "Unable to reconnect. Please start a new session.",
        variant: "destructive"
      });
      return;
    }
    
    isReconnectingRef.current = true;
    reconnectionAttemptsRef.current++;
    
    const delay = Math.min(1000 * Math.pow(2, reconnectionAttemptsRef.current - 1), 8000);
    console.log(`🔄 Attempting reconnection ${reconnectionAttemptsRef.current}/${maxReconnectionAttempts} after ${delay}ms`);
    
    if (reconnectionAttemptsRef.current >= 2) {
      toast({
        title: "Reconnecting...",
        description: `Attempt ${reconnectionAttemptsRef.current} of ${maxReconnectionAttempts}`,
        duration: 3000,
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await connect();
      reconnectionAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      console.log("✅ Reconnection successful");
      toast({
        title: "Reconnected",
        description: "Connection restored successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("❌ Reconnection failed:", error);
      isReconnectingRef.current = false;
      attemptReconnection();
    }
  };

  const connect = async () => {
    if (connectionState === 'connecting' || connectionState === 'connected') {
      console.log("Already connecting or connected");
      return;
    }

    try {
      setConnectionState('connecting');
      console.log("🔗 Connecting via WebRTC...");

      // Check voice limit before starting
      if (voiceTimer?.hasReachedLimit) {
        console.log('⏱️ Voice limit reached');
        onVoiceLimitReached?.();
        setConnectionState('disconnected');
        return;
      }

      // Cleanup any existing connection
      if (rtcRef.current) {
        rtcRef.current.disconnect();
        rtcRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Handle events from WebRTC data channel
      const handleMessage = async (event: any) => {
        console.log('Received:', event.type);

        switch (event.type) {
          case 'session.created':
            console.log('✅ WebRTC session created');
            setConnectionState('connected');
            reconnectionAttemptsRef.current = 0;
            voiceTimer?.start();
            if (!isReconnectingRef.current) {
              toast({
                title: "Connected",
                description: "Cleo is ready!",
                duration: 2000,
              });
            }
            break;

          case 'content.marker':
            console.log('📍 Content marker:', event.data?.type);
            if (onContentEvent && event.data) {
              onContentEvent(event.data as ContentEvent);
            }
            break;

          case 'content.block':
            console.log('🎨 Content block received');
            if (onContentEvent && event.block) {
              onContentEvent({ 
                type: 'upsert_content', 
                block: event.block, 
                autoShow: event.autoShow 
              });
            }
            break;

          case 'input_audio_buffer.speech_started':
            setIsListening(true);
            setIsSpeaking(false);
            break;

          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            break;

          case 'conversation.item.input_audio_transcription.completed':
            const userMessage = event.transcript;
            setCurrentTranscript('');
            setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
            
            // Save to database
            if (currentConversationId.current) {
              await supabase.from('cleo_messages').insert({
                conversation_id: currentConversationId.current,
                role: 'user',
                content: userMessage
              });
            }
            break;

          case 'response.audio_transcript.delta':
            setCurrentTranscript(prev => prev + event.delta);
            break;

          case 'response.audio_transcript.done':
            if (event.transcript) {
              setMessages(prev => [...prev, { role: 'assistant', content: event.transcript }]);
              
              // Save to database
              if (currentConversationId.current) {
                await supabase.from('cleo_messages').insert({
                  conversation_id: currentConversationId.current,
                  role: 'assistant',
                  content: event.transcript
                });
              }
            }
            setCurrentTranscript('');
            break;

          case 'response.created':
            setIsSpeaking(true);
            break;

          case 'response.done':
            setIsSpeaking(false);
            break;

          case 'error':
            console.error('OpenAI error:', event);
            toast({
              title: "AI Error",
              description: event.error?.message || "An error occurred",
              variant: "destructive",
            });
            break;
        }
      };

      // Initialize RealtimeChat
      rtcRef.current = new RealtimeChat(
        handleMessage,
        selectedMicrophoneId,
        selectedSpeakerId
      );

      const result = await rtcRef.current.init(
        currentConversationId.current,
        lessonPlan?.id,
        topic,
        yearGroup
      );

      currentConversationId.current = result.conversationId;
      onConversationCreated?.(result.conversationId);
      
      console.log("✅ WebRTC connection established");

    } catch (error) {
      console.error('❌ Connection error:', error);
      setConnectionState('disconnected');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Attempt reconnection if appropriate
      if (!errorMessage.includes('authenticated') && 
          !errorMessage.includes('quota') &&
          reconnectionAttemptsRef.current < maxReconnectionAttempts) {
        attemptReconnection();
      }
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting...');
    
    if (rtcRef.current) {
      rtcRef.current.disconnect();
      rtcRef.current = null;
    }
    
    voiceTimer?.pause();
    setConnectionState('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
    reconnectionAttemptsRef.current = 0;
    isReconnectingRef.current = false;
  };

  const sendUserMessage = (text: string) => {
    if (rtcRef.current) {
      console.log('📤 Sending text message:', text);
      
      // Save to database
      if (currentConversationId.current) {
        supabase.from('cleo_messages').insert({
          conversation_id: currentConversationId.current,
          role: 'user',
          content: text
        }).then(() => console.log('✅ Message saved'));
      }
      
      rtcRef.current.sendMessage(text);
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    } else {
      console.warn('Cannot send message: Not connected');
      toast({
        title: "Not Connected",
        description: "Please connect first",
        variant: "destructive",
      });
    }
  };

  // This component renders nothing - it's just for voice logic
  return null;
};
