import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CleoInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const CleoInput: React.FC<CleoInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        size="icon"
        className="flex-shrink-0 h-11 w-11"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};
