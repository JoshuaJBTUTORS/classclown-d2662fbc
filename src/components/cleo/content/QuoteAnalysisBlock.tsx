import React from 'react';
import { motion } from 'framer-motion';
import { QuoteAnalysisContent } from '@/types/lessonContent';
import { Quote, BookMarked, Lightbulb, Target } from 'lucide-react';
import { ContentActionButtons } from './ContentActionButtons';
import { LatexRenderer } from './LatexRenderer';
import { Badge } from '@/components/ui/badge';

interface QuoteAnalysisBlockProps {
  data: QuoteAnalysisContent;
  onContentAction?: (action: string, message: string) => void;
}

export const QuoteAnalysisBlock: React.FC<QuoteAnalysisBlockProps> = ({ data, onContentAction }) => {
  if (!data || !data.quote || !data.source) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Quote analysis content not available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 shadow-sm">
        {/* Quote Section */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Quote className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <blockquote className="text-lg font-serif italic text-foreground leading-relaxed border-l-4 border-amber-400 dark:border-amber-600 pl-4">
                <LatexRenderer content={data.quote} />
              </blockquote>
              <p className="text-sm text-muted-foreground mt-2 pl-4">— {data.source}</p>
            </div>
          </div>
        </div>

        {/* Context Section (if provided) */}
        {data.context && (
          <div className="mb-5 bg-background/50 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <h5 className="text-sm font-semibold text-foreground">Context</h5>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <LatexRenderer content={data.context} />
            </p>
          </div>
        )}

        {/* Thematic Links */}
        {data.thematicLinks && data.thematicLinks.length > 0 && (
          <div className="mb-5">
            <div className="flex items-start gap-2 mb-3">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <h5 className="text-sm font-semibold text-foreground">Thematic Links</h5>
            </div>
            <ul className="space-y-2 ml-6">
              {data.thematicLinks.map((link, index) => (
                <li key={index} className="text-sm text-muted-foreground list-disc">
                  <LatexRenderer content={link} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Words & Techniques Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {/* Key Words */}
          {data.keyWords && data.keyWords.length > 0 && (
            <div className="bg-background/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-foreground mb-3">Key Words</h5>
              <div className="flex flex-wrap gap-2">
                {data.keyWords.map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Literary Techniques */}
          {data.techniques && data.techniques.length > 0 && (
            <div className="bg-background/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-foreground mb-3">Literary Techniques</h5>
              <div className="flex flex-wrap gap-2">
                {data.techniques.map((technique, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-amber-300 dark:border-amber-700">
                    {technique}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exam Tips */}
        {data.examTips && data.examTips.length > 0 && (
          <div className="bg-amber-100 dark:bg-amber-950/40 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
              <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Exam Tips</h5>
            </div>
            <ul className="space-y-1 ml-6">
              {data.examTips.map((tip, index) => (
                <li key={index} className="text-sm text-amber-900 dark:text-amber-100 list-disc">
                  <LatexRenderer content={tip} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        {onContentAction && (
          <ContentActionButtons
            contentId={`quote-${data.source.toLowerCase().replace(/\s+/g, '-')}`}
            contentTitle="Quote Analysis"
            onActionClick={onContentAction}
          />
        )}
      </div>
    </motion.div>
  );
};
