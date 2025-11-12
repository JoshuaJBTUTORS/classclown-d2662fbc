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
  onConnectionStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onModelChange?: (model: 'mini' | 'full') => void;
  onProvideControls?: (controls: { 
    connect: () => void; 
    disconnect: () => void; 
    sendUserMessage: (text: string) => void;
    attemptReconnect?: () => void;
  }) => void;
  voiceTimer?: {
    start: () => void;
    pause: () => void;
    hasReachedLimit: boolean;
  };
  onVoiceLimitReached?: () => void;
  onUnexpectedDisconnection?: (info: { code: number; reason: string; conversationId?: string; attemptCount?: number; autoReconnecting?: boolean }) => void;
  onReconnectAttempt?: (attemptCount: number) => void;
  onReconnectSuccess?: () => void;
  onReconnectFailed?: () => void;
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
  onModelChange,
  onProvideControls,
  voiceTimer,
  onVoiceLimitReached,
  onUnexpectedDisconnection,
  onReconnectAttempt,
  onReconnectSuccess,
  onReconnectFailed,
  selectedMicrophoneId,
  selectedSpeakerId
}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState<'mini' | 'full'>('mini');
  const [audioContextState, setAudioContextState] = useState<string>('unknown');
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [wasUserDisconnect, setWasUserDisconnect] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioStreamRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);
  const currentConversationId = useRef<string | undefined>(conversationId);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStepIdRef = useRef<string | null>(null);
  const lastStepTitleRef = useRef<string | null>(null);

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
  
  // Notify parent of model changes
  useEffect(() => {
    onModelChange?.(currentModel);
  }, [currentModel, onModelChange]);

  // Provide connect/disconnect controls to parent
  useEffect(() => {
    onProvideControls?.({ connect, disconnect, sendUserMessage });
  }, [onProvideControls]);

  // Cleanup reconnect timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      // Close any existing connection first
      if (wsRef.current) {
        console.log('🔌 Closing existing connection before reconnect');
        wsRef.current.close();
        wsRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay to ensure clean closure
      }

      // Clean up any previous audio state before connecting
      if (playerRef.current) {
        playerRef.current.clearQueue();
        playerRef.current.pause();
        console.log('🔊 Audio cleaned up before reconnect');
      }

      setConnectionState('connecting');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

    // Create audio player with selected output device (reuse if exists, or create new)
    if (!playerRef.current) {
      playerRef.current = new AudioStreamPlayer(selectedSpeakerId);
    }
    
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
      if (lessonPlan?.id) {
        wsUrl += `&lessonPlanId=${encodeURIComponent(lessonPlan.id)}`;
      }
      // Add resume parameters if we have last step info
      if (lastStepIdRef.current && lastStepTitleRef.current) {
        wsUrl += `&resume=true&lastStepId=${encodeURIComponent(lastStepIdRef.current)}&lastStepTitle=${encodeURIComponent(lastStepTitleRef.current)}`;
        console.log('🔄 Reconnecting with resume parameters:', { stepId: lastStepIdRef.current, stepTitle: lastStepTitleRef.current });
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
              // Track for resume functionality
              lastStepIdRef.current = data.data.stepId;
              lastStepTitleRef.current = data.data.stepTitle;
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
            
          case 'content.marker':
            console.log('📍 Content marker received:', data.data);
            onContentEvent?.(data.data);
            break;
            
          case 'model.switching':
            console.log('🧠 Model switching:', data);
            toast({
              title: "Switching to Deep Explanation Mode",
              description: "Using advanced AI for detailed explanations...",
            });
            break;
            
          case 'model.switched':
            console.log('✅ Model switched to:', data.model);
            setCurrentModel(data.model);
            toast({
              title: data.model === 'full' ? "Deep Explanation Mode Active" : "Efficient Mode Active",
              description: data.model === 'full' 
                ? "🧠 Now using GPT-4 for thorough explanations" 
                : "Now using efficient teaching mode",
            });
            break;
            
          case 'confusion.detected':
            console.log('❓ Confusion detected:', data.transcript);
            break;
            
          case 'explanation.complete':
            console.log('✅ Explanation complete');
            break;

          case 'connection.error':
            console.error('🚨 Connection Error:', data);
            toast({
              title: data.fatal ? "Connection Lost" : "Connection Issue",
              description: data.message || data.error,
              variant: "destructive",
              duration: data.fatal ? 8000 : 5000,
            });
            if (data.fatal) {
              // Clean disconnect on fatal errors
              setTimeout(() => disconnect(), 2000);
            }
            break;

          case 'connection.closed':
            console.log('🔌 Connection closed:', data);
            if (!data.wasClean) {
              toast({
                title: "Connection Interrupted",
                description: data.message || "The connection was lost unexpectedly. Please start a new session.",
                variant: "destructive",
                duration: 6000,
              });
            }
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
        
        // If we're in the middle of reconnecting, trigger attemptReconnect instead of permanently disconnecting
        if (isReconnecting) {
          console.log('⚠️ Error during reconnect attempt, will retry');
          return;
        }
        
        setConnectionState('disconnected');
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice service",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed - detailed info:');
        console.log('  Close code:', event.code);
        console.log('  Close reason:', event.reason || '(no reason provided)');
        console.log('  Was clean:', event.wasClean);
        console.log('  Was user disconnect:', wasUserDisconnect);
        console.log('  Is reconnecting:', isReconnecting);
        console.log('  Navigator online:', navigator.onLine);
        
        setConnectionState('disconnected');
        stopRecording();
        
        // Clean up audio immediately to prevent overlap
        if (playerRef.current) {
          playerRef.current.clearQueue();
          playerRef.current.pause();
          console.log('🔊 Audio playback stopped due to disconnect');
        }
        
        // Detect unexpected disconnections - now includes 1005
        const unexpectedCodes = [1001, 1005, 1006, 1011, 1012, 1013, 1014, 1015];
        const isUnexpected = unexpectedCodes.includes(event.code) || !event.wasClean;
        
        if (isUnexpected && !wasUserDisconnect && !isReconnecting) {
          console.log('⚠️ Unexpected disconnection detected - starting auto-reconnect', { code: event.code, reason: event.reason });
          onUnexpectedDisconnection?.({
            code: event.code,
            reason: event.reason || 'Connection lost',
            conversationId: currentConversationId.current,
            attemptCount: 0,
            autoReconnecting: true,
          });
          // Automatically start reconnection after a brief delay
          setTimeout(() => attemptReconnect(3), 100);
        } else if (wasUserDisconnect) {
          // Reset flag after user-initiated disconnect
          setWasUserDisconnect(false);
        }
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
      recorderRef.current = new AudioStreamRecorder(
        (base64Audio) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio
            }));
          }
        },
        selectedMicrophoneId
      );

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
    setWasUserDisconnect(true); // Mark as user-initiated
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

  const attemptReconnect = async (maxAttempts: number = 3): Promise<void> => {
    if (reconnectAttempts >= maxAttempts) {
      console.log('❌ Max reconnection attempts reached');
      setIsReconnecting(false);
      setConnectionState('disconnected');
      onReconnectFailed?.();
      return;
    }

    const currentAttempt = reconnectAttempts + 1;
    console.log(`🔄 Attempting reconnection ${currentAttempt}/${maxAttempts}`);
    
    // Update state immediately
    setIsReconnecting(true);
    setConnectionState('reconnecting');
    setReconnectAttempts(currentAttempt);
    
    // Notify parent of current attempt (for silent retry logic)
    onReconnectAttempt?.(currentAttempt);

    // Exponential backoff: 2s, 4s, 8s
    const delay = Math.pow(2, reconnectAttempts) * 1000;
    console.log(`⏳ Reconnecting in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await connect();
        
        // Success!
        console.log('✅ Reconnection successful');
        setReconnectAttempts(0);
        setIsReconnecting(false);
        setConnectionState('connected');
        onReconnectSuccess?.();
      } catch (error) {
        console.error(`❌ Reconnection attempt ${currentAttempt} failed:`, error);
        // Try again
        await attemptReconnect(maxAttempts);
      }
    }, delay);
  };

  // Expose attemptReconnect to parent via onProvideControls
  useEffect(() => {
    onProvideControls?.({ 
      connect, 
      disconnect, 
      sendUserMessage,
      attemptReconnect: () => attemptReconnect(3)
    } as any);
  }, [onProvideControls, connect, disconnect, sendUserMessage, attemptReconnect]);

  // This component renders nothing - it's just for voice logic
  return null;
};
