import React from 'react';
import { motion } from 'framer-motion';

interface TextBlockProps {
  data: string | { text: string } | any;
}

export const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  // Extract text from data - handle both string and object formats
  const getText = (): string => {
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object' && 'text' in data) {
      return String(data.text);
    }
    // Fallback for any other format
    return String(data);
  };

  const textContent = getText();

  // Simple markdown-like rendering for bold text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="prose prose-lg max-w-none"
    >
      <p className="text-lg text-foreground leading-relaxed">
        {renderText(textContent)}
      </p>
    </motion.div>
  );
};
