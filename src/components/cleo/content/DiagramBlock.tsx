import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ContentActionButtons } from './ContentActionButtons';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagramBlockProps {
  data: {
    url?: string;
    svg?: string;
    caption?: string;
    alt?: string;
    description?: string;
    elements?: string[];
  };
  onContentAction?: (action: string, message: string) => void;
  yearGroup?: string;
}

export const DiagramBlock: React.FC<DiagramBlockProps> = ({ data, onContentAction, yearGroup }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(data?.url);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  console.log('🖼️ DiagramBlock rendered with data:', {
    hasUrl: !!imageUrl,
    hasSvg: !!data?.svg,
    caption: data?.caption,
    alt: data?.alt,
    fullData: data
  });
  
  const hasUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0;
  const hasSvg = data?.svg && typeof data.svg === 'string' && data.svg.trim().startsWith('<svg');

  const handleRetry = async () => {
    if (!data?.description && !data?.caption) {
      console.warn('No description available for retry');
      return;
    }

    setIsRetrying(true);
    setRetryFailed(false);

    // Notify Cleo that we're retrying
    onContentAction?.('diagram_retry_started', 
      `The diagram "${data.caption || 'visual'}" is being regenerated. Please wait a moment.`);

    try {
      const prompt = data.description 
        ? `Small compact educational diagram: ${data.description}. ${data.elements?.length ? `Must clearly show: ${data.elements.join(', ')}.` : ''} Style: minimalist icon-style illustration, simple and clean, white background.`
        : `Educational diagram for: ${data.caption}. Style: minimalist icon-style illustration, simple and clean, white background.`;

      console.log('🔄 Retrying diagram generation with prompt:', prompt);

      const { data: result, error } = await supabase.functions.invoke('generate-diagram-image', {
        body: { prompt }
      });

      if (error) {
        throw error;
      }

      if (result?.imageUrl) {
        console.log('✅ Diagram retry successful:', result.imageUrl);
        setImageUrl(result.imageUrl);
        // Notify Cleo of success
        onContentAction?.('diagram_retry_success', 
          `Great news! The diagram for "${data.caption || 'visual'}" has been successfully generated.`);
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('❌ Diagram retry failed:', error);
      setRetryFailed(true);
      // Notify Cleo of failure
      onContentAction?.('diagram_retry_failed', 
        `Unfortunately, the diagram "${data.caption || 'visual'}" couldn't be generated. Let me describe it verbally instead.`);
    } finally {
      setIsRetrying(false);
    }
  };

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
        <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <img 
            src={imageUrl} 
            alt={data.alt || data.caption || 'Diagram'} 
            className="w-full h-auto object-contain p-6"
            loading="lazy"
          />
        </div>
      ) : hasSvg ? (
        <div 
          className="w-full rounded-lg overflow-hidden border border-border bg-card p-4"
          dangerouslySetInnerHTML={{ __html: data.svg }} 
        />
      ) : (
        <div className="w-full rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <div className="space-y-1">
              <p className="text-foreground font-medium">
                {retryFailed ? "Still couldn't generate this diagram" : "Oops! Something went wrong"}
              </p>
              <p className="text-sm text-muted-foreground">
                {retryFailed 
                  ? "Cleo will describe what it would have shown"
                  : "The diagram couldn't be generated"
                }
              </p>
            </div>
            {!retryFailed && (
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying}
                variant="outline"
                className="mt-2 gap-2"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {data.caption && (
        <p className="text-xs text-muted-foreground/80 mt-3 text-center font-medium px-4">
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
