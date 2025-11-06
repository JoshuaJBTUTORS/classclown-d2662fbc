import React from 'react';
import { motion } from 'framer-motion';
import { DefinitionContent } from '@/types/lessonContent';
import { BookOpen } from 'lucide-react';
import { ContentActionButtons } from './ContentActionButtons';

interface DefinitionBlockProps {
  data: DefinitionContent;
  onContentAction?: (action: string, message: string) => void;
}

export const DefinitionBlock: React.FC<DefinitionBlockProps> = ({ data, onContentAction }) => {
  // Defensive check for undefined data
  if (!data || !data.term || !data.definition) {
    console.error('DefinitionBlock received invalid data:', data);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-l-4 border-purple-300 dark:border-purple-700 rounded-r-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-foreground mb-2">{data.term}</h4>
            <p className="text-base text-muted-foreground mb-3 leading-relaxed">
              {data.definition}
            </p>
            {data.example && (
              <div className="bg-background/50 rounded-md p-3 mt-3">
                <p className="text-sm font-medium text-primary mb-1">Example:</p>
                <p className="text-sm text-muted-foreground italic">{data.example}</p>
              </div>
            )}
            {onContentAction && (
              <ContentActionButtons
                contentId={`def-${data.term.toLowerCase().replace(/\s+/g, '-')}`}
                contentTitle={data.term}
                onActionClick={onContentAction}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
