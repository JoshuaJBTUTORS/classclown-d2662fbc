import React from 'react';
import { QuoteAnalysisContent } from '@/types/lessonContent';

interface QuoteAnalysisBlockProps {
  data: QuoteAnalysisContent | any;
  onContentAction?: (action: string, message: string) => void;
}

export const QuoteAnalysisBlock: React.FC<QuoteAnalysisBlockProps> = ({ data }) => {
  // Handle both properly typed data and any malformed data
  const quote = typeof data === 'string' ? data : data?.quote || '';
  const analysis = typeof data === 'object' ? data?.analysis || '' : '';

  if (!quote) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-600">Quote content is loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm">
      {/* Quote Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
          📖 Quote
        </h4>
        <blockquote className="pl-4 border-l-4 border-amber-400 italic text-lg text-gray-800">
          "{quote}"
        </blockquote>
      </div>

      {/* Analysis Section */}
      {analysis && (
        <div className="space-y-2 pt-4 border-t border-amber-200">
          <h4 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
            🔍 Analysis
          </h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {analysis}
          </p>
        </div>
      )}
    </div>
  );
};
