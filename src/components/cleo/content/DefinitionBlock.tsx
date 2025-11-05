import React from 'react';
import { motion } from 'framer-motion';
import { DefinitionContent } from '@/types/lessonContent';
import { BookOpen } from 'lucide-react';

interface DefinitionBlockProps {
  data: DefinitionContent | any;
}

export const DefinitionBlock: React.FC<DefinitionBlockProps> = ({ data }) => {
  // Normalize data structure from database format
  const normalizedData: DefinitionContent = {
    term: data?.term || '',
    definition: data?.definition || '',
    example: data?.example || undefined
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-foreground mb-2">{normalizedData.term}</h4>
            <p className="text-base text-muted-foreground mb-3 leading-relaxed">
              {normalizedData.definition}
            </p>
            {normalizedData.example && (
              <div className="bg-background/50 rounded-md p-3 mt-3">
                <p className="text-sm font-medium text-primary mb-1">Example:</p>
                <p className="text-sm text-muted-foreground italic">{normalizedData.example}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
