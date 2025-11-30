
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, TrendingUp, Target } from 'lucide-react';
import { AssessmentScore, UserAssessmentStats } from '@/services/aiAssessmentService';
import AssessmentImprovementDashboard from './AssessmentImprovementDashboard';

interface AssessmentCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  onRetake: () => void;
  onBackToCourse: () => void;
  currentScore: AssessmentScore;
  bestScore: UserAssessmentStats | null;
  assessmentTitle: string;
  isFirstAttempt: boolean;
  sessionId?: string;
}

const AssessmentCompletionDialog: React.FC<AssessmentCompletionDialogProps> = ({
  open,
  onClose,
  onRetake,
  onBackToCourse,
  currentScore,
  bestScore,
  assessmentTitle,
  isFirstAttempt,
  sessionId
}) => {
  const [activeTab, setActiveTab] = useState("results");

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  const isNewBestScore = bestScore && currentScore.percentage_score > bestScore.percentage_score;

  const handleLessonClick = (lessonId: string) => {
    // Navigate to the specific lesson - this would need to be implemented
    // based on your routing structure
    console.log('Navigate to lesson:', lessonId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Assessment Complete: {assessmentTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="improvement" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Improvement Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            {/* Current Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Score</span>
                  {isNewBestScore && (
                    <Badge variant="default" className="bg-green-600">
                      New Best!
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className={`text-6xl font-bold ${getScoreColor(currentScore.percentage_score)}`}>
                    {currentScore.percentage_score}%
                  </div>
                  <div className="text-gray-600">
                    {currentScore.total_marks_achieved} out of {currentScore.total_marks_available} marks
                  </div>
                  <Badge 
                    variant={getScoreBadgeVariant(currentScore.percentage_score)}
                    className="text-lg px-4 py-2"
                  >
                    {currentScore.percentage_score >= 80 ? 'Excellent' : 
                     currentScore.percentage_score >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold text-blue-600">
                      {currentScore.questions_answered}
                    </div>
                    <div className="text-sm text-gray-600">Questions Answered</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold text-purple-600">
                      {currentScore.total_questions}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Score Comparison */}
            {bestScore && !isFirstAttempt && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-xl font-semibold text-green-600">
                        {bestScore.percentage_score}%
                      </div>
                      <div className="text-sm text-gray-600">Previous Best</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl font-semibold text-blue-600">
                        {bestScore.completed_sessions + 1}
                      </div>
                      <div className="text-sm text-gray-600">Total Attempts</div>
                    </div>
                    <div className="space-y-1">
                      <div className={`text-xl font-semibold ${
                        currentScore.percentage_score >= bestScore.percentage_score ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {currentScore.percentage_score >= bestScore.percentage_score ? '+' : ''}
                        {currentScore.percentage_score - bestScore.percentage_score}%
                      </div>
                      <div className="text-sm text-gray-600">Score Change</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={onBackToCourse} variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
              <Button onClick={onRetake} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake Assessment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="improvement" className="space-y-6">
            {sessionId ? (
              <AssessmentImprovementDashboard 
                sessionId={sessionId}
                onLessonClick={handleLessonClick}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">
                    Improvement recommendations are not available for this session.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={onBackToCourse} variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
              <Button onClick={onRetake} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake Assessment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentCompletionDialog;
