import React from 'react';
import { WorkedExampleContent } from '@/types/lessonContent';

interface WorkedExampleBlockProps {
  data: WorkedExampleContent;
  onContentAction?: (action: string, message: string) => void;
}

export const WorkedExampleBlock: React.FC<WorkedExampleBlockProps> = ({ data }) => {
  if (!data || typeof data !== 'object' || !data.question || !data.steps || !data.answer) {
    return (
      <div className="bg-muted/50 rounded-xl p-6 border border-border">
        <p className="text-muted-foreground text-sm">Worked example data is loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl border-2 border-pastel-mint-200/40 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-pastel-mint-50 px-6 py-3 border-b border-pastel-mint-200/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📐</span>
          <h3 className="font-semibold text-foreground">Worked Example</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Problem */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Problem:</p>
          <div className="bg-pastel-peach-50 rounded-lg p-4 border border-pastel-peach-200/50">
            <p className="text-foreground font-medium whitespace-pre-wrap">{data.question}</p>
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Solution:</p>
          <div className="space-y-3">
            {data.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pastel-mint-100 border border-pastel-mint-200/50 flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground">{index + 1}</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-foreground whitespace-pre-wrap">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Answer */}
        <div className="bg-pastel-mint-50 rounded-lg p-4 border-2 border-pastel-mint-200/60">
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
              <p className="text-foreground font-semibold text-lg whitespace-pre-wrap">{data.answer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
