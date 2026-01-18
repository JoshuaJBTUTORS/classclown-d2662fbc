import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Bot, User, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MarkingBreakdown {
  strengths?: string[];
  improvements?: string[];
  aiMarked?: boolean;
}

interface ResponseToReview {
  id: string;
  questionNumber: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  marksAwarded: number;
  marksAvailable: number;
  aiFeedback?: string;
  markingBreakdown?: MarkingBreakdown;
  confidenceScore?: number;
  markedBy?: string;
}

interface MarkReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: ResponseToReview | null;
  onMarkUpdated: () => void;
}

export const MarkReviewDialog: React.FC<MarkReviewDialogProps> = ({
  open,
  onOpenChange,
  response,
  onMarkUpdated
}) => {
  const [marks, setMarks] = useState(response?.marksAwarded || 0);
  const [feedback, setFeedback] = useState(response?.aiFeedback || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (response) {
      setMarks(response.marksAwarded);
      setFeedback(response.aiFeedback || '');
    }
  }, [response]);

  if (!response) return null;

  const adjustMarks = (delta: number) => {
    setMarks(prev => Math.max(0, Math.min(response.marksAvailable, prev + delta)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_responses')
        .update({
          marks_awarded: marks,
          ai_feedback: feedback,
          marked_by: 'manual',
          marked_at: new Date().toISOString()
        })
        .eq('id', response.id);

      if (error) throw error;

      toast.success('Marks updated successfully');
      onMarkUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating marks:', error);
      toast.error('Failed to update marks');
    } finally {
      setIsSaving(false);
    }
  };

  const percentage = response.marksAvailable > 0 
    ? (marks / response.marksAvailable) * 100 
    : 0;

  const getScoreColor = () => {
    if (percentage >= 70) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const breakdown = response.markingBreakdown as MarkingBreakdown | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Marks - Question {response.questionNumber}
            {response.markedBy === 'ai' && (
              <Badge variant="outline" className="gap-1">
                <Bot className="h-3 w-3" />
                AI Marked
              </Badge>
            )}
            {response.markedBy === 'manual' && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                Manually Marked
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-4">
            {/* Question */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Question</h4>
                <p className="text-sm">{response.questionText}</p>
              </CardContent>
            </Card>

            {/* Model Answer */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Model Answer
                </h4>
                <p className="text-sm">{response.correctAnswer}</p>
              </CardContent>
            </Card>

            {/* Student Answer */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Student's Answer</h4>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {response.studentAnswer || <em className="text-muted-foreground">No answer provided</em>}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis (if available) */}
            {breakdown && (breakdown.strengths?.length || breakdown.improvements?.length) && (
              <Card className="border-primary/20">
                <CardContent className="pt-4 space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    AI Analysis
                    {response.confidenceScore && (
                      <Badge variant="secondary" className="text-xs">
                        {(response.confidenceScore * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </h4>

                  {breakdown.strengths && breakdown.strengths.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 flex items-center gap-1 mb-2">
                        <CheckCircle className="h-3 w-3" />
                        Strengths
                      </h5>
                      <ul className="space-y-1">
                        {breakdown.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {breakdown.improvements && breakdown.improvements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-amber-700 flex items-center gap-1 mb-2">
                        <Lightbulb className="h-3 w-3" />
                        Areas for Improvement
                      </h5>
                      <ul className="space-y-1">
                        {breakdown.improvements.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Marks Adjustment */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-4">Marks</h4>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustMarks(-1)}
                    disabled={marks <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className={`text-center px-6 py-3 rounded-lg ${getScoreColor()}`}>
                    <div className="text-3xl font-bold">
                      {marks}/{response.marksAvailable}
                    </div>
                    <div className="text-sm font-medium">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustMarks(1)}
                    disabled={marks >= response.marksAvailable}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {marks !== response.marksAwarded && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Changed from {response.marksAwarded} marks
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Feedback</h4>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add feedback for the student..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};