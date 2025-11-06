import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VoiceControls } from './VoiceControls';
import { Mic, MessageSquare, Send } from 'lucide-react';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface HybridChatInterfaceProps {
  mode: ChatMode;
  messages: CleoMessage[];
  isVoiceConnected: boolean;
  isVoiceListening: boolean;
  isVoiceSpeaking: boolean;
  isTextLoading: boolean;
  voiceTimePercent: number;
  voiceTimeRemaining: number;
  onModeSwitch: (mode: ChatMode) => void;
  onVoiceConnect: () => void;
  onVoiceDisconnect: () => void;
  onTextSend: (message: string) => void;
  canUseVoice: boolean;
}

export const HybridChatInterface: React.FC<HybridChatInterfaceProps> = ({
  mode,
  messages,
  isVoiceConnected,
  isVoiceListening,
  isVoiceSpeaking,
  isTextLoading,
  voiceTimePercent,
  voiceTimeRemaining,
  onModeSwitch,
  onVoiceConnect,
  onVoiceDisconnect,
  onTextSend,
  canUseVoice,
}) => {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isTextLoading) {
      onTextSend(textInput);
      setTextInput('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Voice Timer Header */}
      <Card className="p-4 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={mode === 'voice' ? 'default' : 'secondary'}>
              {mode === 'voice' ? (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Mode
                </>
              ) : (
                <>
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Text Mode
                </>
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Voice time: {formatTime(voiceTimeRemaining)} remaining
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onModeSwitch(mode === 'voice' ? 'text' : 'voice')}
            disabled={mode === 'text' && !canUseVoice}
          >
            Switch to {mode === 'voice' ? 'Text' : 'Voice'}
          </Button>
        </div>
        <Progress value={voiceTimePercent} className="h-2" />
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[80%] p-3 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.mode === 'voice' ? (
                    <Mic className="w-4 h-4 mt-1 flex-shrink-0" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        {mode === 'voice' ? (
          <div className="flex justify-center">
            <VoiceControls
              isConnected={isVoiceConnected}
              isListening={isVoiceListening}
              isSpeaking={isVoiceSpeaking}
              onConnect={onVoiceConnect}
              onDisconnect={onVoiceDisconnect}
            />
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isTextLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isTextLoading || !textInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
