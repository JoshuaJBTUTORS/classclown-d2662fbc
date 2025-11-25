import React, { useRef, useEffect } from 'react';
import { CleoMessage } from '@/types/cleoTypes';
import { Mic, MessageSquare } from 'lucide-react';
interface TranscriptPanelProps {
  messages: CleoMessage[];
  isVoiceSpeaking: boolean;
}
export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  messages,
  isVoiceSpeaking
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only scroll within this component's container, never affect page scroll
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);
  return <div className="space-y-2">
      {messages.map((msg, idx) => (
        <div key={idx} className={`p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-muted/50' : 'bg-primary/10'}`}>
          <div className="flex items-start gap-2">
            {msg.role === 'user' ? <Mic className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" /> : <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-primary" />}
            <span className="text-foreground">{msg.content}</span>
          </div>
        </div>
      ))}
      
      {isVoiceSpeaking && <div className="text-xs text-gray-500 italic flex items-center gap-1.5 p-2">
          <span className="animate-pulse text-green-600">●</span> Cleo is speaking...
        </div>}
      
      <div ref={messagesEndRef} />
    </div>;
};