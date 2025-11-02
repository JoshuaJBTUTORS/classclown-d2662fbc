import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface CleoMessageProps {
  message: Message;
}

export const CleoMessage: React.FC<CleoMessageProps> = ({ message }) => {
  if (message.role === 'system') return null;

  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
      !isAssistant && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isAssistant ? "bg-primary/10" : "bg-secondary"
      )}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-primary" />
        ) : (
          <User className="w-5 h-5 text-secondary-foreground" />
        )}
      </div>

      {/* Message bubble */}
      <div className={cn(
        "rounded-2xl px-4 py-3 max-w-[80%]",
        isAssistant 
          ? "bg-muted text-foreground" 
          : "bg-primary text-primary-foreground"
      )}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {message.content.split('\n').map((line, idx) => (
            <p key={idx} className="mb-2 last:mb-0 whitespace-pre-wrap">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
