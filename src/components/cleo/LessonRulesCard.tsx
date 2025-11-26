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
          <span className="text-2xl">🔄</span>
          <p className="text-foreground/90 flex-1">
            I don't like being interrupted, so let's take turns speaking 😋
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">❓</span>
          <p className="text-foreground/90 flex-1">
            Ask me as many questions as you want!
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">🔇</span>
          <p className="text-foreground/90 flex-1">
            If you're in a loud background, use the mute/unmute button during the lesson
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">⏸️</span>
          <p className="text-foreground/90 flex-1">
            Don't move on until you get it... I have infinite patience!
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <p className="text-foreground/90 flex-1">
            If I'm speaking too slow or too fast, use the speed button on screen to adjust
          </p>
        </div>
      </div>
    </Card>
  );
};
