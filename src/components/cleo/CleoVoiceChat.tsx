import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone } from 'lucide-react';
import { AudioStreamRecorder, AudioStreamPlayer } from '@/utils/realtimeAudio';
import { VoiceWaveform } from './VoiceWaveform';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CleoVoiceChatProps {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export const CleoVoiceChat: React.FC<CleoVoiceChatProps> = ({
  conversationId,
  onConversationCreated
}) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioStreamRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);
  const currentConversationId = useRef<string | undefined>(conversationId);

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

      // Connect WebSocket
      const wsUrl = `wss://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/cleo-realtime-voice?token=${session.access_token}${currentConversationId.current ? `&conversationId=${currentConversationId.current}` : ''}`;
      
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

          case 'input_audio_buffer.speech_started':
            setIsListening(true);
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
        setConnectionState('error');
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice service",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setConnectionState('idle');
        stopRecording();
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setConnectionState('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
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
    } catch (error) {
      console.error('Error starting recorder:', error);
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
  };

  const disconnect = () => {
    stopRecording();
    playerRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;
    playerRef.current = null;
    setConnectionState('idle');
    setIsListening(false);
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' : 
            connectionState === 'connecting' ? 'bg-yellow-500' : 
            connectionState === 'error' ? 'bg-red-500' : 'bg-muted'
          }`} />
          <span className="text-sm font-medium">
            {connectionState === 'connected' ? 'Connected' :
             connectionState === 'connecting' ? 'Connecting...' :
             connectionState === 'error' ? 'Connection Error' : 'Not Connected'}
          </span>
        </div>

        {connectionState === 'connected' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
          >
            <Phone className="w-4 h-4 mr-2" />
            End Call
          </Button>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {connectionState === 'idle' ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Voice Chat with Cleo</h2>
            <p className="text-muted-foreground">
              Start a voice conversation for a natural learning experience
            </p>
            <Button onClick={connect} size="lg" className="mt-4">
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>
          </div>
        ) : (
          <>
            {/* Waveform */}
            <div className="mb-8">
              <VoiceWaveform
                isActive={isListening || isSpeaking}
                type={isListening ? 'listening' : 'speaking'}
              />
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <p className="text-lg font-medium">
                {isListening ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Mic className="w-5 h-5 text-primary" />
                    Listening...
                  </span>
                ) : isSpeaking ? (
                  <span className="flex items-center gap-2 justify-center">
                    🔊 Cleo is speaking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center text-muted-foreground">
                    <MicOff className="w-5 h-5" />
                    Waiting for your voice...
                  </span>
                )}
              </p>
            </div>

            {/* Live Transcript */}
            {currentTranscript && (
              <div className="w-full max-w-2xl p-4 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground italic">
                  {currentTranscript}
                </p>
              </div>
            )}

            {/* Message History */}
            <div className="w-full max-w-2xl space-y-3 max-h-64 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary/10 ml-auto max-w-[80%]'
                      : 'bg-accent/10 mr-auto max-w-[80%]'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === 'user' ? 'You' : 'Cleo'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
