import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface QuickChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const QuickChatInput: React.FC<QuickChatInputProps> = ({
  onSend,
  disabled,
  placeholder = "Ask anything..."
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="text-xs h-8 flex-1"
      />
      <Button 
        type="submit" 
        size="sm" 
        disabled={disabled || !input.trim()}
        className="h-8 px-3"
      >
        <Send className="w-3 h-3" />
      </Button>
    </form>
  );
};
