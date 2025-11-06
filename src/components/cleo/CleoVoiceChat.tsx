import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AudioStreamRecorder, AudioStreamPlayer } from '@/utils/realtimeAudio';
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
  onVoiceLimitReached
}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioContextState, setAudioContextState] = useState<string>('unknown');
  const [microphoneActive, setMicrophoneActive] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioStreamRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);
  const currentConversationId = useRef<string | undefined>(conversationId);

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

  const connect = async () => {
    try {
      setConnectionState('connecting');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

    // Create audio player
    playerRef.current = new AudioStreamPlayer();
    
    // Resume AudioContext immediately (user gesture)
    await playerRef.current.resume();
    setAudioContextState('running');

      // Connect WebSocket
      let wsUrl = `wss://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/cleo-realtime-voice?token=${session.access_token}`;
      if (currentConversationId.current) {
        wsUrl += `&conversationId=${currentConversationId.current}`;
      }
      if (topic) {
        wsUrl += `&topic=${encodeURIComponent(topic)}`;
      }
      if (yearGroup) {
        wsUrl += `&yearGroup=${encodeURIComponent(yearGroup)}`;
      }
      if (lessonPlan) {
        wsUrl += `&lessonPlan=${encodeURIComponent(JSON.stringify(lessonPlan))}`;
      }
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        toast({
          title: "Connected",
          description: "Start speaking to Cleo!",
        });
        startRecording();
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type);

        switch (data.type) {
          case 'connection.status':
            if (data.conversationId && !currentConversationId.current) {
              currentConversationId.current = data.conversationId;
              onConversationCreated?.(data.conversationId);
            }
            break;

          case 'session.created':
            console.log('Session created:', data);
            setConnectionState('connected');
            break;

          case 'content.marker':
            console.log('📍 ========== CONTENT MARKER RECEIVED ==========');
            console.log('📍 Full data:', JSON.stringify(data, null, 2));
            console.log('📍 Marker type:', data.data?.type);
            if (data.data?.type === 'move_to_step') {
              console.log('📍 Move to step ID:', data.data.stepId);
              console.log('📍 Move to step title:', data.data.stepTitle);
            }
            if (onContentEvent) {
              console.log('📍 Calling onContentEvent with:', data.data);
              onContentEvent(data.data as ContentEvent);
            } else {
              console.warn('📍 ⚠️ No onContentEvent handler registered!');
            }
            break;

          case 'content.block':
            console.log('🎨 Content block received:', data.block);
            if (onContentEvent && data.block) {
              onContentEvent({ 
                type: 'upsert_content', 
                block: data.block, 
                autoShow: data.autoShow 
              });
            }
            break;

          case 'input_audio_buffer.speech_started':
            setIsListening(true);
            setIsSpeaking(false);
            playerRef.current?.pause();
            break;

          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            break;

          case 'conversation.item.input_audio_transcription.completed':
            setCurrentTranscript('');
            setMessages(prev => [...prev, { role: 'user', content: data.transcript }]);
            break;

          case 'response.audio.delta':
            setIsSpeaking(true);
            if (playerRef.current && data.delta) {
              await playerRef.current.playChunk(data.delta);
            }
            break;

          case 'response.audio_transcript.delta':
            setCurrentTranscript(prev => prev + data.delta);
            break;

          case 'response.audio_transcript.done':
            if (data.transcript) {
              setMessages(prev => [...prev, { role: 'assistant', content: data.transcript }]);
            }
            setCurrentTranscript('');
            break;

          case 'response.done':
            setIsSpeaking(false);
            break;

          case 'server_error':
            console.error('🚨 Detailed Server Error:', data.details);
            toast({
              title: "OpenAI Error",
              description: data.error || "Unknown error from AI service",
              variant: "destructive",
            });
            break;

          case 'error':
            console.error('Server error:', data.error);
            toast({
              title: "Error",
              description: data.error,
              variant: "destructive",
            });
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('disconnected');
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice service",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setConnectionState('disconnected');
        stopRecording();
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setConnectionState('disconnected');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    // Check voice limit before starting
    if (voiceTimer?.hasReachedLimit) {
      console.log('⏱️ Voice limit reached, cannot start recording');
      onVoiceLimitReached?.();
      return;
    }

    try {
      recorderRef.current = new AudioStreamRecorder((base64Audio) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      });

      await recorderRef.current.start();
      setMicrophoneActive(true);
      voiceTimer?.start();
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Error starting recorder:', error);
      setMicrophoneActive(false);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setMicrophoneActive(false);
    voiceTimer?.pause();
    console.log('🎤 Recording stopped');
  };

  const disconnect = () => {
    console.log('Disconnecting...');
    stopRecording();
    playerRef.current?.stop();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
  };

  const sendUserMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending user text message:', text);
      wsRef.current.send(JSON.stringify({
        type: 'user_message',
        text: text
      }));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  // This component renders nothing - it's just for voice logic
  return null;
};
