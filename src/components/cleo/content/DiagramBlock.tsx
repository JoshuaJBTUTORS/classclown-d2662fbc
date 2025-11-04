import React from 'react';
import { motion } from 'framer-motion';

interface DiagramBlockProps {
  data: {
    url?: string;
    svg?: string;
    caption?: string;
    alt?: string;
  };
}

export const DiagramBlock: React.FC<DiagramBlockProps> = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="my-6"
    >
      <div className="w-full aspect-video rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/20">
        <span className="text-muted-foreground text-sm">Visual content not available</span>
      </div>
      {data.caption && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {data.caption}
        </p>
      )}
    </motion.div>
  );
};
