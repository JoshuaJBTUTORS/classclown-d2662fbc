import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeChat';
import { ElevenLabsPlayer } from '@/utils/ElevenLabsPlayer';
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
  onProvideControls?: (controls: { 
    connect: () => void; 
    disconnect: () => void; 
    sendUserMessage: (text: string) => void;
    toggleMute?: () => void;
    isMuted?: boolean;
    updateVoiceSpeed?: (speed: number) => void;
  }) => void;
  onSpeedChange?: (speed: number) => void;
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
  onSpeedChange,
  selectedMicrophoneId,
  selectedSpeakerId
}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const rtcRef = useRef<RealtimeChat | null>(null);
  const elevenLabsPlayerRef = useRef<ElevenLabsPlayer | null>(null);
  const currentConversationId = useRef<string | undefined>(conversationId);
  const isConnectingRef = useRef(false); // Synchronous lock to prevent race conditions
  const textAccumulator = useRef<string>(''); // Accumulate text for ElevenLabs
  
  // Speech confirmation buffer refs (NOT USED - VAD handled server-side by OpenAI)
  const speechStartTime = useRef<number | null>(null);
  const interruptionTimer = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  // Notify parent of state changes
  useEffect(() => {
    onConnectionStateChange?.(connectionState);
  }, [connectionState, onConnectionStateChange]);

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
    isSpeakingRef.current = isSpeaking; // Keep ref in sync
  }, [isSpeaking, onSpeakingChange]);

  const toggleMute = () => {
    if (rtcRef.current) {
      const newMuteState = rtcRef.current.toggleMute();
      setIsMuted(newMuteState);
    }
  };

  // Voice speed removed - not applicable with ElevenLabs

  // Provide connect/disconnect controls to parent
  useEffect(() => {
    onProvideControls?.({ 
      connect, 
      disconnect: () => disconnect(false), 
      sendUserMessage, 
      toggleMute, 
      isMuted
    });
  }, [onProvideControls, isMuted]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);


  const connect = async () => {
    // SYNCHRONOUS check - prevents race conditions
    if (isConnectingRef.current) {
      console.log("⚠️ Connection already in progress, ignoring duplicate call");
      return;
    }
    
    if (connectionState === 'connecting' || connectionState === 'connected') {
      console.log("Already connecting or connected");
      return;
    }

    // Set flag IMMEDIATELY (synchronous)
    isConnectingRef.current = true;

    try {
      setConnectionState('connecting');
      console.log("🔗 Connecting via WebRTC...");

      // Cleanup any existing connection
      if (rtcRef.current) {
        rtcRef.current.disconnect();
        rtcRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Initialize ElevenLabs player
      elevenLabsPlayerRef.current = new ElevenLabsPlayer((speaking) => {
        setIsSpeaking(speaking);
      });

      // Handle events from WebRTC data channel
      const handleMessage = async (event: any) => {
        console.log('Received:', event.type);

        switch (event.type) {
          case 'session.created':
            console.log('✅ WebRTC session created (text-only mode)');
            setConnectionState('connected');
            toast({
              title: "Connected",
              description: "Cleo is ready!",
              duration: 2000,
            });
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
            speechStartTime.current = Date.now();
            break;

          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            speechStartTime.current = null;
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

          case 'response.text.delta':
            // Accumulate text chunks
            textAccumulator.current += event.delta;
            setCurrentTranscript(prev => prev + event.delta);
            break;

          case 'response.text.done':
            const fullText = textAccumulator.current;
            textAccumulator.current = ''; // Reset accumulator
            
            if (fullText) {
              console.log(`📝 Full text response (${fullText.length} chars):`, fullText);
              
              setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
              
              // Save to database
              if (currentConversationId.current) {
                await supabase.from('cleo_messages').insert({
                  conversation_id: currentConversationId.current,
                  role: 'assistant',
                  content: fullText
                });
              }
              
              // Send to ElevenLabs for TTS
              console.log('🎙️ Sending to ElevenLabs...');
              try {
                const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
                  body: {
                    text: fullText,
                    voiceId: 'XB0fDUnXU5powFXDhCwa' // Charlotte
                  }
                });

                if (error) {
                  console.error('ElevenLabs error:', error);
                } else if (data?.audioContent) {
                  console.log('✅ Received audio from ElevenLabs');
                  await elevenLabsPlayerRef.current?.playAudio(data.audioContent);
                }
              } catch (err) {
                console.error('Failed to generate speech:', err);
              }
            }
            setCurrentTranscript('');
            break;

          case 'response.created':
            console.log('📤 Response started');
            break;

          case 'response.done':
            console.log('✅ Response complete');
            break;

          case 'response.function_call_arguments.done':
            const functionName = event.name;
            const args = JSON.parse(event.arguments);
            const callId = event.call_id;
            
            console.log(`🎨 Function called: ${functionName}`, args);
            
            // Handle move_to_step
            if (functionName === 'move_to_step') {
              const { stepId, stepTitle } = args;
              
              console.log(`📚 ========== MOVE_TO_STEP CALLED ==========`);
              console.log(`📚 Step ID: ${stepId}`);
              console.log(`📚 Step Title: ${stepTitle}`);
              
              // Emit content marker event to show step content
              if (onContentEvent) {
                onContentEvent({
                  type: 'move_to_step',
                  stepId: stepId
                });
              }
              
              // Confirm to OpenAI
              rtcRef.current?.sendEvent({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: callId,
                  output: JSON.stringify({ 
                    success: true, 
                    message: `Moved to step: ${stepTitle}. All content for this step is now visible to the student.` 
                  })
                }
              });
              
              // Trigger next response
              rtcRef.current?.sendEvent({ type: 'response.create' });
              break;
            }
            
            // Handle complete_step
            if (functionName === 'complete_step') {
              const { stepId } = args;
              
              console.log(`✅ ========== COMPLETE_STEP CALLED ==========`);
              console.log(`✅ Step ID: ${stepId}`);
              
              // Emit event to mark step as complete
              if (onContentEvent) {
                onContentEvent({
                  type: 'complete_step',
                  stepId: stepId
                });
              }
              
              // Confirm to OpenAI
              rtcRef.current?.sendEvent({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: callId,
                  output: JSON.stringify({ 
                    success: true, 
                    message: `Step ${stepId} marked as complete.` 
                  })
                }
              });
              
              // Trigger next response
              rtcRef.current?.sendEvent({ type: 'response.create' });
              break;
            }
            
            // Handle complete_lesson
            if (functionName === 'complete_lesson') {
              const { summary } = args;
              
              console.log(`🎓 ========== COMPLETE_LESSON CALLED ==========`);
              console.log(`🎓 Summary: ${summary}`);
              
              // Emit event to complete lesson
              if (onContentEvent) {
                onContentEvent({
                  type: 'lesson_complete',
                  summary: summary || 'Lesson completed successfully!'
                });
              }
              
              // Confirm to OpenAI
              rtcRef.current?.sendEvent({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: callId,
                  output: JSON.stringify({ 
                    success: true, 
                    message: 'Lesson marked as complete. Great work!' 
                  })
                }
              });
              
              // PHASE 1 FIX: Wait for closing remarks, then auto-disconnect
              console.log('🎓 Waiting 3 seconds for closing remarks before auto-disconnect...');
              setTimeout(() => {
                console.log('🎓 Auto-disconnecting after lesson completion');
                rtcRef.current?.disconnect(false);
              }, 3000);
              break;
            }
            
            // Handle other tools (show_table, show_definition, ask_question)
            let contentBlock: any = null;
            
            if (functionName === 'show_table') {
              contentBlock = {
                id: args.id,
                stepId: 'current',
                type: 'table',
                data: {
                  headers: args.headers,
                  rows: args.rows
                },
                visible: false
              };
            } else if (functionName === 'show_definition') {
              contentBlock = {
                id: args.id,
                stepId: 'current',
                type: 'definition',
                data: {
                  term: args.term,
                  definition: args.definition,
                  example: args.example
                },
                visible: false
              };
            } else if (functionName === 'ask_question') {
              contentBlock = {
                id: args.id,
                stepId: 'current',
                type: 'question',
                data: {
                  id: args.id,
                  question: args.question,
                  options: args.options,
                  explanation: args.explanation
                },
                visible: false
              };
            }
            
            // Send content block to UI
            if (contentBlock && onContentEvent) {
              onContentEvent({
                type: 'upsert_content',
                block: contentBlock,
                autoShow: true
              });
            }
            
            // Confirm to OpenAI
            rtcRef.current?.sendEvent({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify({ success: true, displayed: true })
              }
            });
            
            // Trigger next response
            rtcRef.current?.sendEvent({ type: 'response.create' });
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

      // Fetch and notify parent of user's voice speed preference
      
      console.log("✅ WebRTC connection established with unified introduction flow");

    } catch (error) {
      console.error('❌ Connection error:', error);
      setConnectionState('disconnected');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });

      // No automatic reconnection - user must manually reconnect
      console.log('❌ Connection failed - automatic reconnection disabled');
    } finally {
      // Reset lock on success or failure
      isConnectingRef.current = false;
    }
  };

  // advanceSessionStage function removed - using unified prompt approach

  const disconnect = async (wasInterrupted: boolean = false) => {
    console.log('🔌 Disconnecting...');
    
    if (rtcRef.current) {
      await rtcRef.current.disconnect(wasInterrupted);
      rtcRef.current = null;
    }
    
    if (elevenLabsPlayerRef.current) {
      elevenLabsPlayerRef.current.stop();
      elevenLabsPlayerRef.current = null;
    }
    
    setConnectionState('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
    speechStartTime.current = null;
    textAccumulator.current = '';
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
