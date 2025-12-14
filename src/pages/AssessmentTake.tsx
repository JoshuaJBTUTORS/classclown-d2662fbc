import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentAssignmentService } from '@/services/assessmentAssignmentService';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import ExamPaperAssessment from '@/components/assessments/ExamPaperAssessment';
import { supabase } from '@/integrations/supabase/client';

const AssessmentTake = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [markingStates, setMarkingStates] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, any>>({});

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

  // Auto-start when loaded
  useEffect(() => {
    if (assignment && assignment.status === 'assigned') {
      startMutation.mutate();
    }
  }, [assignment?.id, assignment?.status]);

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
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!assignment || !questions) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Assessment not found</h2>
              <Button className="mt-4" onClick={() => navigate('/assessment-center')}>
                Back to Assessment Center
              </Button>
            </div>
          </main>
        </div>
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
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
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
      </div>
    </div>
  );
};

export default AssessmentTake;
