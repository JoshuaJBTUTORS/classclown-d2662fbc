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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div 
          key={msg.id}
          className={`text-xs p-2 rounded-lg ${
            msg.role === 'user' 
              ? 'bg-green-50 ml-2' 
              : 'bg-gray-50 mr-2'
          }`}
        >
          <div className="flex items-start gap-1.5">
            {msg.role === 'assistant' && (
              msg.mode === 'voice' ? (
                <Mic className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
              ) : (
                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
              )
            )}
            <p className="flex-1 line-clamp-4 text-gray-700 leading-relaxed">{msg.content}</p>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
      
      {isVoiceSpeaking && (
        <div className="text-xs text-gray-500 italic flex items-center gap-1.5 p-2">
          <span className="animate-pulse text-green-600">●</span> Cleo is speaking...
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
