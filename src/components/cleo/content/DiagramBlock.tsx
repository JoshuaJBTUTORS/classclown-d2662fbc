import React from 'react';
import { motion } from 'framer-motion';
import { ContentActionButtons } from './ContentActionButtons';

interface DiagramBlockProps {
  data: {
    url?: string;
    svg?: string;
    caption?: string;
    alt?: string;
  };
  onContentAction?: (action: string, message: string) => void;
}

export const DiagramBlock: React.FC<DiagramBlockProps> = ({ data, onContentAction }) => {
  console.log('🖼️ DiagramBlock rendered with data:', {
    hasUrl: !!data?.url,
    hasSvg: !!data?.svg,
    caption: data?.caption,
    alt: data?.alt,
    fullData: data
  });
  
  const hasUrl = data?.url && typeof data.url === 'string' && data.url.length > 0;
  const hasSvg = data?.svg && typeof data.svg === 'string' && data.svg.trim().startsWith('<svg');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="my-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📈</span>
        <span className="text-sm font-medium text-muted-foreground">Diagram</span>
      </div>
      
      {hasUrl ? (
        <div className="w-full rounded-lg overflow-hidden border border-border bg-card">
          <img 
            src={data.url} 
            alt={data.alt || data.caption || 'Diagram'} 
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      ) : hasSvg ? (
        <div 
          className="w-full rounded-lg overflow-hidden border border-border bg-card p-4"
          dangerouslySetInnerHTML={{ __html: data.svg }} 
        />
      ) : (
        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-cyan-200 dark:border-cyan-800 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
          <span className="text-muted-foreground text-sm">Visual content not available</span>
        </div>
      )}
      
      {data.caption && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {data.caption}
        </p>
      )}
      {onContentAction && (
        <ContentActionButtons
          contentId={`diagram-${(data.caption || data.alt || 'visual').toLowerCase().replace(/\s+/g, '-')}`}
          contentTitle={data.caption || data.alt || 'Diagram'}
          onActionClick={onContentAction}
        />
      )}
    </motion.div>
  );
};
