import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Clock, User, FileText } from 'lucide-react';

interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: number;
  submission_text: string | null;
  attachment_url: string | null;
  status: string;
  percentage_score: number | null;
  feedback: string | null;
  grade: string | null;
  submitted_at: string;
  student: {
    id: number;
    first_name: string;
    last_name: string;
  };
  homework: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
  };
}

interface QuickHomeworkSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLessonId: string;
  lessonTitle: string;
}

const QuickHomeworkSubmissionsModal: React.FC<QuickHomeworkSubmissionsModalProps> = ({
  isOpen,
  onClose,
  currentLessonId,
  lessonTitle
}) => {
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [previousLessonTitle, setPreviousLessonTitle] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchPreviousLessonSubmissions();
    }
  }, [isOpen, currentLessonId]);

  const fetchPreviousLessonSubmissions = async () => {
    setIsLoading(true);
    try {
      // First, get the current lesson details
      const { data: currentLesson, error: currentLessonError } = await supabase
        .from('lessons')
        .select('title, start_time, is_recurring, parent_lesson_id, tutor_id')
        .eq('id', currentLessonId)
        .single();

      if (currentLessonError) {
        throw new Error('Failed to fetch current lesson details');
      }

      // Find the previous week's lesson (7 days ago)
      const currentLessonDate = new Date(currentLesson.start_time);
      const previousWeekDate = new Date(currentLessonDate);
      previousWeekDate.setDate(previousWeekDate.getDate() - 7);

      // Find the previous lesson instance
      const { data: previousLesson, error: previousLessonError } = await supabase
        .from('lessons')
        .select('id, title, start_time')
        .eq('tutor_id', currentLesson.tutor_id)
        .eq('title', currentLesson.title)
        .gte('start_time', previousWeekDate.toISOString().split('T')[0])
        .lt('start_time', currentLessonDate.toISOString())
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (previousLessonError || !previousLesson) {
        setPreviousLessonTitle('No previous lesson found');
        setSubmissions([]);
        return;
      }

      setPreviousLessonTitle(previousLesson.title);

      // Fetch homework for the previous lesson
      const { data: homework, error: homeworkError } = await supabase
        .from('homework')
        .select('id, title, description, due_date')
        .eq('lesson_id', previousLesson.id)
        .single();

      if (homeworkError || !homework) {
        setSubmissions([]);
        return;
      }

      // Fetch submissions for that homework
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('homework_submissions')
        .select(`
          id,
          homework_id,
          student_id,
          submission_text,
          attachment_url,
          status,
          percentage_score,
          feedback,
          grade,
          submitted_at,
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .eq('homework_id', homework.id);

      if (submissionsError) {
        throw new Error('Failed to fetch submissions');
      }

      const submissionsWithHomework = submissionsData?.map(submission => ({
        ...submission,
        homework
      })) || [];

      setSubmissions(submissionsWithHomework);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error(error.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, percentageScore: number, feedback?: string) => {
    setIsGrading(true);
    setGradingSubmissionId(submissionId);
    
    try {
      const { error } = await supabase
        .from('homework_submissions')
        .update({
          percentage_score: percentageScore,
          feedback: feedback || null,
          status: 'graded'
        })
        .eq('id', submissionId);

      if (error) {
        throw new Error('Failed to update grade');
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId 
            ? { ...submission, percentage_score: percentageScore, feedback: feedback || null, status: 'graded' }
            : submission
        )
      );

      toast.success('Grade updated successfully');
    } catch (error: any) {
      console.error('Error grading submission:', error);
      toast.error(error.message || 'Failed to update grade');
    } finally {
      setIsGrading(false);
      setGradingSubmissionId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Homework Submissions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Previous lesson: {previousLessonTitle}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
            <p className="text-gray-600">
              No homework submissions found for the previous lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-base">
                          {submission.student.first_name} {submission.student.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {submission.homework.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      {submission.percentage_score !== null && (
                        <Badge variant="outline">
                          {submission.percentage_score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.submission_text && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Submission:</Label>
                        <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                          {submission.submission_text}
                        </p>
                      </div>
                    )}
                    
                    {submission.attachment_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Attachment:</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(submission.attachment_url!, '_blank')}
                          className="mt-1"
                        >
                          View File
                        </Button>
                      </div>
                    )}

                    <QuickGradingSection
                      submission={submission}
                      onGrade={handleGradeSubmission}
                      isGrading={isGrading && gradingSubmissionId === submission.id}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface QuickGradingSectionProps {
  submission: HomeworkSubmission;
  onGrade: (submissionId: string, score: number, feedback?: string) => void;
  isGrading: boolean;
}

const QuickGradingSection: React.FC<QuickGradingSectionProps> = ({
  submission,
  onGrade,
  isGrading
}) => {
  const [score, setScore] = useState(submission.percentage_score?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSubmit = () => {
    const numericScore = parseInt(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      toast.error('Please enter a valid score between 0-100');
      return;
    }
    onGrade(submission.id, numericScore, feedback.trim() || undefined);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Grading</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor={`score-${submission.id}`} className="text-xs text-gray-600">
            Score (%)
          </Label>
          <Input
            id={`score-${submission.id}`}
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="0-100"
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`feedback-${submission.id}`} className="text-xs text-gray-600">
            Feedback (optional)
          </Label>
          <Textarea
            id={`feedback-${submission.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Quick feedback..."
            className="mt-1 h-16 resize-none"
          />
        </div>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isGrading || !score}
        size="sm"
        className="mt-3"
      >
        {isGrading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Update Grade'
        )}
      </Button>
    </div>
  );
};

export default QuickHomeworkSubmissionsModal;