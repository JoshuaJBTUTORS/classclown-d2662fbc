import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { useAuth } from '@/contexts/AuthContext';
import AssessmentAccessControl from './AssessmentAccessControl';
import AssessmentTimer from './AssessmentTimer';
import AssessmentQuestionCard from './AssessmentQuestion';
import AssessmentNavigation from './AssessmentNavigation';
import AssessmentCompletion from './AssessmentCompletion';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

interface AIAssessmentViewerProps {
  assessmentId?: string;
  embedded?: boolean;
}

const AIAssessmentViewer: React.FC<AIAssessmentViewerProps> = ({ 
  assessmentId: propAssessmentId, 
  embedded = false 
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propAssessmentId || paramId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [key: string]: string }>({});
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: any }>({});
  const [isMarking, setIsMarking] = useState<{ [key: string]: boolean }>({});

  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => aiAssessmentService.getAssessmentById(id!),
    enabled: !!id,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['assessmentQuestions', id],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(id!),
    enabled: !!id && !!assessment,
  });

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['assessmentSession', id],
    queryFn: () => aiAssessmentService.getUserSession(id!),
    enabled: !!id && !!user && !!assessment,
  });

  const { mutate: createSession } = useMutation({
    mutationFn: () => aiAssessmentService.createAssessmentSession(id!),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentSession', id] });
      refetchSession();
      setSessionStartTime(new Date());
      toast({
        title: "Session started",
        description: "The assessment session has started.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting session",
        description: error.message || "Failed to start the assessment session.",
        variant: "destructive",
      });
    },
  });

  const { mutate: completeSession } = useMutation({
    mutationFn: (sessionId: string) => aiAssessmentService.completeSession(sessionId),
    onSuccess: () => {
      toast({
        title: "Assessment completed",
        description: "You have completed the assessment.",
      });
      if (!embedded) {
        navigate('/learning-hub');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error completing assessment",
        description: error.message || "Failed to complete the assessment.",
        variant: "destructive",
      });
    },
  });

  const { mutate: markQuestion } = useMutation({
    mutationFn: async ({ sessionId, questionId, answer }: { sessionId: string, questionId: string, answer: string }) => {
      console.log('🔍 Starting question marking process...');
      console.log('Session ID:', sessionId);
      console.log('Question ID:', questionId);
      console.log('Student Answer:', answer);
      
      try {
        const result = await aiAssessmentService.markSingleQuestion(sessionId, questionId, answer);
        console.log('✅ Marking successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Marking failed:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Mutation onSuccess called:', data);
      setFeedback(prev => ({
        ...prev,
        [variables.questionId]: data,
      }));
      setIsMarking(prev => ({
        ...prev,
        [variables.questionId]: false,
      }));
      toast({
        title: "Answer marked successfully",
        description: `Score: ${data.marks}/${data.maxMarks} marks`,
      });
    },
    onError: (error: any, variables) => {
      console.error('❌ Mutation onError called:', error);
      setIsMarking(prev => ({
        ...prev,
        [variables.questionId]: false,
      }));
      
      let errorMessage = "Failed to mark the question. Please try again.";
      
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = "The marking service is not available. Please contact support.";
        } else if (error.message.includes('unauthorized')) {
          errorMessage = "You don't have permission to mark this question.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error marking question",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (assessment && assessment.time_limit_minutes && sessionStartTime) {
      const totalTime = assessment.time_limit_minutes * 60;
      const startTime = sessionStartTime.getTime();

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const elapsedTime = Math.floor((now - startTime) / 1000);
        const timeLeft = Math.max(0, totalTime - elapsedTime);

        setTimeRemaining(timeLeft);

        if (timeLeft === 0) {
          clearInterval(interval);
          if (session) {
            completeAssessment();
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [assessment, sessionStartTime, session]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setStudentAnswers({ ...studentAnswers, [questionId]: answer });
  };

  const markCurrentQuestion = async () => {
    console.log('🚀 Mark button clicked');
    
    if (!session) {
      console.error('❌ No session available');
      toast({
        title: "Error",
        description: "No active session found. Please start the assessment.",
        variant: "destructive",
      });
      return;
    }

    if (!questions || questions.length === 0) {
      console.error('❌ No questions available');
      toast({
        title: "Error",
        description: "No questions found for this assessment.",
        variant: "destructive",
      });
      return;
    }

    const question = questions[currentQuestionIndex];
    const answer = studentAnswers[question.id] || '';

    if (!answer.trim()) {
      console.warn('⚠️ Empty answer provided');
      toast({
        title: "Empty Answer",
        description: "Please provide an answer before marking.",
        variant: "destructive",
      });
      return;
    }

    console.log('📝 Marking question:', {
      sessionId: session.id,
      questionId: question.id,
      questionText: question.question_text,
      answer: answer,
      questionType: question.question_type
    });

    setIsMarking(prev => ({
      ...prev,
      [question.id]: true,
    }));

    try {
      markQuestion({ sessionId: session.id, questionId: question.id, answer });
    } catch (error) {
      console.error('❌ Error calling markQuestion:', error);
      setIsMarking(prev => ({
        ...prev,
        [question.id]: false,
      }));
    }
  };

  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const startAssessment = () => {
    createSession();
  };

  const completeAssessment = () => {
    if (session) {
      completeSession(session.id);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderMainContent = () => {
    if (assessmentLoading) {
      return (
        <div className={embedded ? "p-6" : "container py-8"}>
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      );
    }

    if (assessmentError || !assessment) {
      return (
        <div className={embedded ? "p-6" : "container py-8"}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
            <p className="text-gray-600 mb-6">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
            {!embedded && (
              <Button onClick={() => navigate('/learning-hub')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Learning Hub
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={embedded ? "p-6" : "container py-8"}>
        {!embedded && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/learning-hub')} 
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Learning Hub
          </Button>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{assessment.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {session ? (
              <>
                {/* Timer and Complete Button Section */}
                <div className="flex items-center justify-between mb-4">
                  <AssessmentTimer 
                    timeRemaining={timeRemaining}
                    hasTimeLimit={!!assessment.time_limit_minutes}
                  />
                  <AssessmentCompletion onComplete={completeAssessment} hasTimeLimit={!!assessment.time_limit_minutes} />
                </div>

                {questionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : questions && questions.length > 0 ? (
                  <>
                    <div className="mb-4">
                      Question {currentQuestionIndex + 1} of {questions.length}
                      <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
                    </div>

                    <AssessmentQuestionCard
                      question={questions[currentQuestionIndex]}
                      studentAnswer={studentAnswers[questions[currentQuestionIndex].id] || ''}
                      onAnswerChange={handleAnswerChange}
                      isMarking={isMarking[questions[currentQuestionIndex].id]}
                      onMark={markCurrentQuestion}
                      feedback={feedback[questions[currentQuestionIndex].id]}
                    />

                    <AssessmentNavigation
                      currentQuestionIndex={currentQuestionIndex}
                      totalQuestions={questions.length}
                      onPrevious={goToPreviousQuestion}
                      onNext={goToNextQuestion}
                    />

                    {/* Additional Complete Assessment Button for non-timed assessments */}
                    {!assessment.time_limit_minutes && (
                      <div className="text-center mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                          Ready to submit your assessment?
                        </p>
                        <AssessmentCompletion 
                          onComplete={completeAssessment}
                          hasTimeLimit={false}
                          className="w-full max-w-xs"
                          variant="default"
                          size="default"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions found for this assessment.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Ready to start the assessment?</p>
                <Button onClick={startAssessment} disabled={assessmentLoading}>
                  Start Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (embedded) {
    return (
      <AssessmentAccessControl 
        assessment={assessment} 
        requiredAccess="take"
      >
        {renderMainContent()}
      </AssessmentAccessControl>
    );
  }

  return (
    <AssessmentAccessControl 
      assessment={assessment} 
      requiredAccess="take"
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </AssessmentAccessControl>
  );
};

export default AIAssessmentViewer;
