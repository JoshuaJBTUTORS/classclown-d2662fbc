import React from 'react';
import { motion } from 'framer-motion';

interface TextBlockProps {
  data: string;
}

export const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
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
        {renderText(data)}
      </p>
    </motion.div>
  );
};
