import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentAssignmentService } from '@/services/assessmentAssignmentService';
import { aiAssessmentService, AssessmentQuestion } from '@/services/aiAssessmentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ArrowLeft, ArrowRight, Send, Clock, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

const AssessmentTake = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions?.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
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
      setShowSubmitDialog(false);
    }
  };

  const isSubmitted = assignment?.status === 'submitted' || assignment?.status === 'reviewed';
  const isLoading = assignmentLoading || questionsLoading;

  const renderQuestion = (question: AssessmentQuestion) => {
    const currentAnswer = answers[question.id] || '';

    return (
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {question.question_number}
            </CardTitle>
            <Badge variant="outline">
              {question.marks_available} {question.marks_available === 1 ? 'mark' : 'marks'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-base mb-6 whitespace-pre-wrap">{question.question_text}</p>

          {question.question_type === 'multiple_choice' ? (
            <RadioGroup
              value={currentAnswer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {question.marking_scheme?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer here..."
              className="min-h-[150px]"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/assessment-center')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assessment Center
              </Button>
              
              <h1 className="text-2xl font-bold">{assignment.assessment?.title}</h1>
              <p className="text-muted-foreground">
                {assignment.assessment?.subject} • {assignment.assessment?.exam_board}
              </p>
              
              {isSubmitted && (
                <Badge variant="secondary" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>

            {/* Progress */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{answeredCount} of {questions.length} answered</span>
              </div>
              <Progress value={progress} />
            </div>

            {/* Question */}
            {currentQuestion && renderQuestion(currentQuestion)}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {/* Question number pills */}
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-primary text-primary-foreground'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : !isSubmitted ? (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions?.length} questions.
              {answeredCount < (questions?.length || 0) && (
                <span className="block mt-2 text-amber-600">
                  Warning: You have {(questions?.length || 0) - answeredCount} unanswered questions.
                </span>
              )}
              <span className="block mt-2">
                Once submitted, you cannot make changes to your answers.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssessmentTake;
