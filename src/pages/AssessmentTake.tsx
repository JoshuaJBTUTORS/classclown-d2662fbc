import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentAssignmentService } from '@/services/assessmentAssignmentService';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ExamPaperAssessment from '@/components/assessments/ExamPaperAssessment';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getDraftKey = (assignmentId: string) => `assessment_draft_${assignmentId}`;

const AssessmentTake = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [markingStates, setMarkingStates] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Record<string, string> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch assignment details
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assessmentAssignmentService.getAssignmentById(assignmentId!),
    enabled: !!assignmentId,
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['assessment-questions', assignment?.assessment_id],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(assignment!.assessment_id),
    enabled: !!assignment?.assessment_id,
  });

  // Start assignment mutation
  const startMutation = useMutation({
    mutationFn: () => assessmentAssignmentService.startAssignment(assignmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: () => assessmentAssignmentService.submitAssignment(assignmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      toast.success('Assessment submitted successfully!');
      navigate('/assessment-center');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit assessment');
    },
  });

  // Load saved draft on mount
  useEffect(() => {
    if (!assignmentId) return;
    
    const draftKey = getDraftKey(assignmentId);
    const saved = localStorage.getItem(draftKey);
    
    if (saved) {
      try {
        const parsedDraft = JSON.parse(saved);
        if (Object.keys(parsedDraft).length > 0) {
          setSavedDraft(parsedDraft);
          setShowRecoveryDialog(true);
        }
      } catch (e) {
        localStorage.removeItem(draftKey);
      }
    }
  }, [assignmentId]);

  // Auto-save answers to localStorage on change
  useEffect(() => {
    if (!assignmentId || Object.keys(answers).length === 0) return;
    
    const draftKey = getDraftKey(assignmentId);
    localStorage.setItem(draftKey, JSON.stringify(answers));
    setHasUnsavedChanges(true);
  }, [answers, assignmentId]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  // Auto-start when loaded
  useEffect(() => {
    if (assignment && assignment.status === 'assigned') {
      startMutation.mutate();
    }
  }, [assignment?.id, assignment?.status]);

  const handleRestoreDraft = () => {
    if (savedDraft) {
      setAnswers(savedDraft);
      toast.success('Previous answers restored');
    }
    setShowRecoveryDialog(false);
  };

  const handleDiscardDraft = () => {
    if (assignmentId) {
      localStorage.removeItem(getDraftKey(assignmentId));
    }
    setSavedDraft(null);
    setShowRecoveryDialog(false);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleMarkQuestion = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer || !answer.trim()) {
      toast.error('Please enter an answer before submitting');
      return;
    }

    setMarkingStates(prev => ({ ...prev, [questionId]: true }));

    try {
      const question = questions?.find(q => q.id === questionId);
      if (!question) return;

      // Call AI marking function
      const { data, error } = await supabase.functions.invoke('ai-mark-cleo-question', {
        body: {
          studentAnswer: answer,
          correctAnswer: question.correct_answer,
          questionText: question.question_text,
          maxMarks: question.marks_available,
          questionType: question.question_type,
          keywords: question.keywords || [],
          markingScheme: question.marking_scheme,
        },
      });

      if (error) throw error;

      setFeedback(prev => ({ ...prev, [questionId]: data }));
      setMarkedQuestions(prev => new Set([...prev, questionId]));
    } catch (error: any) {
      console.error('Marking error:', error);
      toast.error('Failed to mark question');
    } finally {
      setMarkingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Create a session and save responses
      if (assignment?.assessment_id) {
        const session = await aiAssessmentService.createAssessmentSession(assignment.assessment_id);
        
        // Save all answers
        for (const [questionId, answer] of Object.entries(answers)) {
          await aiAssessmentService.submitAnswer(session.id, questionId, answer);
        }
        
        // Complete the session
        await aiAssessmentService.completeSession(session.id);
      }
      
      // Submit the assignment
      await submitMutation.mutateAsync();
      
      // Clear draft on successful submission
      if (assignmentId) {
        localStorage.removeItem(getDraftKey(assignmentId));
        setHasUnsavedChanges(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitted = assignment?.status === 'submitted' || assignment?.status === 'reviewed';
  const isLoading = assignmentLoading || questionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!assignment || !questions) {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className="p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Assessment not found</h2>
            <Button className="mt-4" onClick={() => navigate('/assessment-center')}>
              Back to Assessment Center
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Build assessment object for ExamPaperAssessment
  const assessmentData = {
    id: assignment.assessment_id,
    title: assignment.assessment?.title || 'Assessment',
    description: assignment.assessment?.description,
    subject: assignment.assessment?.subject,
    exam_board: assignment.assessment?.exam_board,
    year: assignment.assessment?.year,
    paper_type: assignment.assessment?.paper_type,
    total_marks: assignment.assessment?.total_marks,
    time_limit_minutes: assignment.assessment?.time_limit_minutes,
    status: assignment.assessment?.status || 'active',
    extract_text: assignment.assessment?.extract_text,
    extract_source: assignment.assessment?.extract_source,
    extract_type: assignment.assessment?.extract_type,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/assessment-center')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment Center
          </Button>

          {isSubmitted && (
            <Badge variant="secondary" className="mb-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              Submitted
            </Badge>
          )}

          {/* Exam Paper Format */}
          <ExamPaperAssessment
            assessment={assessmentData}
            questions={questions}
            studentAnswers={answers}
            onAnswerChange={handleAnswerChange}
            onMarkQuestion={handleMarkQuestion}
            markedQuestions={markedQuestions}
            markingStates={markingStates}
            feedback={feedback}
            onComplete={handleComplete}
            isCompleting={isSubmitting}
            timeRemaining={null}
            hasTimeLimit={false}
            previewMode={isSubmitted}
          />
        </div>
      </main>

      {/* Recovery Dialog */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Resume Previous Progress?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found {savedDraft ? Object.keys(savedDraft).length : 0} saved answers from your previous session. 
              Would you like to restore them or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Restore Answers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssessmentTake;
