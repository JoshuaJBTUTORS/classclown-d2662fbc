import React from 'react';
import { motion } from 'framer-motion';
import { ContentActionButtons } from './ContentActionButtons';

interface TextBlockProps {
  data: string | any;
  onContentAction?: (action: string, message: string) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({ data, onContentAction }) => {
  // Ensure data is a string
  const getText = (): string => {
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object') {
      // Handle object data - try common text properties
      const text = data.text || data.content || data.value;
      if (text) return text;
      // Don't render empty objects
      console.warn('TextBlock received empty object data:', data);
      return '';
    }
    return String(data || '');
  };

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
      <div className="border-l-4 border-indigo-200 dark:border-indigo-800 pl-6 py-2 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-r-lg">
        <p className="text-lg text-foreground leading-relaxed">
          {renderText(getText())}
        </p>
        {onContentAction && (
          <ContentActionButtons
            contentId={`text-${getText().substring(0, 20).toLowerCase().replace(/\s+/g, '-')}`}
            contentTitle={getText().substring(0, 50) + (getText().length > 50 ? '...' : '')}
            onActionClick={onContentAction}
          />
        )}
      </div>
    </motion.div>
  );
};
