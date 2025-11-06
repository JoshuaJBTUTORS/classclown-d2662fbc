import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { QuestionStats } from '@/services/cleoQuestionTrackingService';

interface LessonCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToCourse: () => void;
  onReviewLesson?: () => void;
  questionStats: QuestionStats | null;
  totalTimeMinutes: number;
  lessonTitle: string;
}

export const LessonCompleteDialog: React.FC<LessonCompleteDialogProps> = ({
  isOpen,
  onClose,
  onReturnToCourse,
  onReviewLesson,
  questionStats,
  totalTimeMinutes,
  lessonTitle,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            You've completed "{lessonTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Lesson Statistics
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/80 rounded-md p-3">
                <div className="text-2xl font-bold text-primary">{totalTimeMinutes}</div>
                <div className="text-xs text-muted-foreground">Minutes</div>
              </div>
              
              {questionStats && questionStats.total_questions > 0 && (
                <div className="bg-background/80 rounded-md p-3">
                  <div className="text-2xl font-bold text-primary">
                    {questionStats.accuracy_rate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              )}
            </div>

            {questionStats && questionStats.total_questions > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Questions Answered</span>
                  <span className="font-medium">{questionStats.total_questions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Correct Answers</span>
                  <span className="font-medium text-green-600">
                    {questionStats.correct_answers}
                  </span>
                </div>
                {questionStats.incorrect_answers > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Areas to Review</span>
                    <span className="font-medium text-orange-600">
                      {questionStats.incorrect_answers}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-center text-muted-foreground">
            Keep up the great work! Continue practicing to master this topic.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onReturnToCourse} className="w-full" size="lg">
            <ArrowRight className="w-4 h-4 mr-2" />
            Return to Course
          </Button>
          {onReviewLesson && (
            <Button onClick={onReviewLesson} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Review Lesson
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
