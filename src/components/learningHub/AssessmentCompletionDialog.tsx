
import React from 'react';
import { CheckCircle, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AssessmentScore, UserAssessmentStats } from '@/services/aiAssessmentService';

interface AssessmentCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  onRetake: () => void;
  onBackToCourse: () => void;
  currentScore: AssessmentScore;
  bestScore?: UserAssessmentStats | null;
  assessmentTitle: string;
  isFirstAttempt: boolean;
}

const AssessmentCompletionDialog: React.FC<AssessmentCompletionDialogProps> = ({
  open,
  onClose,
  onRetake,
  onBackToCourse,
  currentScore,
  bestScore,
  assessmentTitle,
  isFirstAttempt
}) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', variant: 'default' as const };
    if (percentage >= 80) return { label: 'Good', variant: 'secondary' as const };
    if (percentage >= 60) return { label: 'Pass', variant: 'outline' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  const scoreBadge = getScoreBadge(currentScore.percentage_score);
  const isNewBest = !bestScore || currentScore.percentage_score > bestScore.percentage_score;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Assessment Complete!
          </DialogTitle>
          <DialogDescription>
            You've completed "{assessmentTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Score Display */}
          <div className="text-center space-y-3">
            <div className="space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(currentScore.percentage_score)}`}>
                {currentScore.percentage_score}%
              </div>
              <div className="text-sm text-muted-foreground">
                {currentScore.total_marks_achieved} out of {currentScore.total_marks_available} marks
              </div>
              <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
            </div>
            
            <Progress value={currentScore.percentage_score} className="w-full" />
            
            <div className="text-xs text-muted-foreground">
              {currentScore.questions_answered} of {currentScore.total_questions} questions answered
            </div>
          </div>

          {/* Best Score & Improvement */}
          {!isFirstAttempt && bestScore && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Best Score:</span>
                <span className="font-bold">{bestScore.percentage_score}%</span>
              </div>
              {isNewBest && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Trophy className="h-4 w-4" />
                  New personal best!
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Total attempts: {bestScore.completed_sessions + 1}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onRetake} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Assessment
          </Button>
          <Button onClick={onBackToCourse} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentCompletionDialog;
