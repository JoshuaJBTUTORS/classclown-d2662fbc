import React from 'react';
import { motion } from 'framer-motion';
import { ContentActionButtons } from './ContentActionButtons';
import { LatexRenderer } from './LatexRenderer';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="cleo-text-block">
        <div className="cleo-text-content">
          <LatexRenderer content={getText()} />
        </div>
        {onContentAction && (
          <div className="cleo-lesson-actions mt-4">
            <button 
              onClick={() => onContentAction('test', `Please test me on "${getText().substring(0, 50)}" with a question.`)}
              className="cleo-pill-btn"
            >
              <span className="icon">✅</span>
              <span>Test me</span>
            </button>
            <button 
              onClick={() => onContentAction('explain', `Please explain "${getText().substring(0, 50)}" in the simplest way possible.`)}
              className="cleo-pill-btn"
            >
              <span className="icon">🧠</span>
              <span>Explain like I'm a potato</span>
            </button>
            <button 
              onClick={() => onContentAction('example', `Please give me a concrete example of "${getText().substring(0, 50)}".`)}
              className="cleo-pill-btn"
            >
              <span className="icon">💡</span>
              <span>Give an example</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
