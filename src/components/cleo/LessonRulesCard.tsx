import React from 'react';
import { Card } from '@/components/ui/card';

export const LessonRulesCard: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 p-6 shadow-lg">
      <h2 className="text-xl font-bold text-foreground mb-6 text-center">
        📚 How to make the most of this lesson
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎚️</span>
          <p className="text-foreground/90 flex-1">
            If I'm speaking too fast or too slow, just say "slow down" or "speed up" and I can adjust
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">❓</span>
          <p className="text-foreground/90 flex-1">
            Ask me as many questions as you want!
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">⏸️</span>
          <p className="text-foreground/90 flex-1">
            Don't move on until you get it... I have infinite patience!
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">📝</span>
          <p className="text-foreground/90 flex-1">
            Have a pen and paper ready to jot down key points
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">⏭️</span>
          <p className="text-foreground/90 flex-1">
            Already confident? Say "skip to exam questions" and I'll jump straight to practice
          </p>
        </div>
      </div>
    </Card>
  );
};
