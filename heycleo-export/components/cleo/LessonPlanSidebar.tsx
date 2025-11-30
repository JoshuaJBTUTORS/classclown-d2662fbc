import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LessonPlanSidebarProps {
  lessonPlan: {
    topic: string;
    learning_objectives: string[];
    teaching_sequence: Array<{
      id: string;
      title: string;
      duration_minutes?: number;
    }>;
  };
  currentStepId?: string;
  completedSteps: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LessonPlanSidebar: React.FC<LessonPlanSidebarProps> = ({
  lessonPlan,
  currentStepId,
  completedSteps,
  isCollapsed = false,
  onToggleCollapse
}) => {
  if (isCollapsed) {
    return (
      <div className="fixed right-4 top-20 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleCollapse}
          className="shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-20 w-80 z-50">
      <Card className="p-4 shadow-xl bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm">Lesson Progress</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-6 w-6"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Objectives */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Objectives</h4>
          <div className="space-y-1">
            {lessonPlan.learning_objectives.slice(0, 3).map((obj, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground/80">{obj}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Sequence */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Steps</h4>
          <div className="space-y-2">
            {lessonPlan.teaching_sequence.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStepId === step.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isCurrent 
                      ? 'bg-primary/10 border border-primary/20' 
                      : isCompleted
                      ? 'bg-muted/50'
                      : 'opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : isCurrent ? (
                      <Circle className="w-4 h-4 text-primary fill-primary/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                    {step.duration_minutes && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{step.duration_minutes}m</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
