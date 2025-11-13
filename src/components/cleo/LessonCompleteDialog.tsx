import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, ArrowRight, RotateCcw, Trophy, Download, Sparkles, BookOpen } from 'lucide-react';
import { QuestionStats } from '@/services/cleoQuestionTrackingService';
import { lessonExportService } from '@/services/lessonExportService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LessonCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToCourse: () => void;
  onReviewLesson?: () => void;
  onAssignPractice?: () => void;
  questionStats: QuestionStats | null;
  totalTimeMinutes: number;
  lessonTitle: string;
  conversationId?: string;
}

export const LessonCompleteDialog: React.FC<LessonCompleteDialogProps> = ({
  isOpen,
  onClose,
  onReturnToCourse,
  onReviewLesson,
  onAssignPractice,
  questionStats,
  totalTimeMinutes,
  lessonTitle,
  conversationId,
}) => {
  const { toast } = useToast();
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateFlashcards = async () => {
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Cannot generate flashcards without a conversation ID",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { conversationId }
      });

      if (error) throw error;

      setFlashcardsGenerated(data?.flashcardsGenerated || 0);
      toast({
        title: "Flashcards generated!",
        description: `${data?.flashcardsGenerated || 0} flashcards created successfully`,
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleExportSummary = async () => {
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Cannot export summary without a conversation ID",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await lessonExportService.exportLessonSummary(conversationId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lessonTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-summary.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Summary exported!",
        description: "Your lesson summary has been downloaded",
      });
    } catch (error) {
      console.error('Error exporting summary:', error);
      toast({
        title: "Error",
        description: "Failed to export lesson summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const incorrectAnswers = questionStats?.incorrect_answers || 0;

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

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 py-4">
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
          </TabsContent>

          <TabsContent value="practice" className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Further Practice
              </h4>
              
              {incorrectAnswers > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Based on your answers, we recommend additional practice on {incorrectAnswers} topic{incorrectAnswers > 1 ? 's' : ''}.
                  </p>
                  {onAssignPractice && (
                    <Button onClick={onAssignPractice} className="w-full" variant="outline">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Practice Resources
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Perfect score!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You've mastered this lesson. No additional practice needed.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-border/50">
                <h5 className="text-sm font-medium mb-2">Flashcards</h5>
                {flashcardsGenerated > 0 ? (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-md p-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />
                    {flashcardsGenerated} flashcards generated successfully!
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={isGeneratingFlashcards}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-purple-600" />
                Export Options
              </h4>
              
              <p className="text-sm text-muted-foreground">
                Download your lesson summary for offline review
              </p>

              <Button
                onClick={handleExportSummary}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download Lesson Summary'}
              </Button>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Includes transcript, questions answered, and key concepts
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
