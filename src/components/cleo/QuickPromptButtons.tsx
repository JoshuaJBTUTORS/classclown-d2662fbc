import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickPromptButtonsProps {
  onPromptClick: (prompt: string) => void;
  isConnected: boolean;
  isSpeaking: boolean;
}

export const QuickPromptButtons: React.FC<QuickPromptButtonsProps> = ({ 
  onPromptClick, 
  isConnected, 
  isSpeaking 
}) => {
  const prompts = [
    { text: "I have a question", icon: MessageCircle },
    { text: "Can you explain that again?", icon: RefreshCw },
    { text: "I don't understand", icon: HelpCircle },
  ];

  // Only show when connected but Cleo is not speaking
  if (!isConnected || isSpeaking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-wrap gap-2 justify-center"
    >
      {prompts.map((prompt, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onPromptClick(prompt.text)}
          className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <prompt.icon className="w-3.5 h-3.5 mr-1.5" />
          {prompt.text}
        </Button>
      ))}
    </motion.div>
  );
};
