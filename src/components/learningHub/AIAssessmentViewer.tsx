import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { aiAssessmentService, AssessmentScore, UserAssessmentStats } from '@/services/aiAssessmentService';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import AssessmentAccessControl from './AssessmentAccessControl';
import AssessmentTimer from './AssessmentTimer';
import AssessmentQuestionCard from './AssessmentQuestion';
import AssessmentNavigation from './AssessmentNavigation';
import AssessmentCompletion from './AssessmentCompletion';
import AssessmentCompletionDialog from './AssessmentCompletionDialog';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AIAssessmentViewerProps {
  assessmentId?: string;
  embedded?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onAssessmentComplete?: (score: number) => void;
}

const AIAssessmentViewer: React.FC<AIAssessmentViewerProps> = ({ 
  assessmentId: propAssessmentId, 
  embedded = false, 
  isOpen, 
  onClose,
  onAssessmentComplete
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propAssessmentId || paramId;
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [key: string]: string }>({});
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: any }>({});
  const [isMarking, setIsMarking] = useState<{ [key: string]: boolean }>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [isCompletingAssessment, setIsCompletingAssessment] = useState(false);
  const [completionScore, setCompletionScore] = useState<AssessmentScore | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [bestScore, setBestScore] = useState<UserAssessmentStats | null>(null);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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
    mutationFn: async (sessionId: string) => {
      const score = await aiAssessmentService.completeSessionWithScore(sessionId);
      
      // Get best score for comparison
      if (user?.id) {
        const userBestScore = await aiAssessmentService.getUserBestScore(id!, user.id);
        setBestScore(userBestScore);
      }
      
      return { score, sessionId };
    },
    onSuccess: async ({ score, sessionId }) => {
      setIsCompletingAssessment(false);
      setCompletionScore(score);
      
      // Try to find the current module from the URL or context
      const courseMatch = location.pathname.match(/\/course\/([^\/]+)/);
      if (courseMatch && user?.id) {
        const courseId = courseMatch[1];
        
        // Find which module this assessment belongs to
        const { data: assessmentLesson } = await supabase
          .from('course_lessons')
          .select('module_id, course_modules!inner(course_id)')
          .eq('content_url', id)
          .eq('content_type', 'ai-assessment')
          .single();
        
        if (assessmentLesson) {
          // Mark assessment as completed in progress
          await learningHubService.markAssessmentCompleted(assessmentLesson.module_id, score.percentage_score || 0);
          
          // Try to unlock the next module
          await learningHubService.unlockNextModuleAfterAssessment(
            courseId, 
            assessmentLesson.module_id, 
            user.id
          );
        }
      }
      
      setShowCompletionDialog(true);
      
      // Call the onAssessmentComplete callback if provided
      if (onAssessmentComplete && score.percentage_score !== undefined) {
        onAssessmentComplete(score.percentage_score);
      }
      
      // Invalidate relevant queries to refresh progress data
      queryClient.invalidateQueries({ queryKey: ['assessmentSession', id] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      queryClient.invalidateQueries({ queryKey: ['module-access-list'] });
      queryClient.invalidateQueries({ queryKey: ['personalized-learning-path'] });
      
      // Show success toast
      toast({
        title: "Assessment completed!",
        description: `You scored ${score.percentage_score}%. Checking for unlocked content...`,
      });
    },
    onError: (error: any) => {
      setIsCompletingAssessment(false);
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
      setMarkedQuestions(prev => new Set([...prev, variables.questionId]));
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

    // Check if question is already marked
    if (markedQuestions.has(question.id)) {
      toast({
        title: "Question Already Marked",
        description: "This question has already been marked in this session.",
        variant: "destructive",
      });
      return;
    }

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
      setIsCompletingAssessment(true);
      completeSession(session.id);
    }
  };

  const handleRetakeAssessment = () => {
    setShowCompletionDialog(false);
    setCompletionScore(null);
    setBestScore(null);
    setStudentAnswers({});
    setFeedback({});
    setMarkedQuestions(new Set());
    setCurrentQuestionIndex(0);
    createSession(); // This will create a new session with incremented attempt_number
  };

  const handleBackToCourse = () => {
    setShowCompletionDialog(false);
    
    // Show loading toast while navigating
    toast({
      title: "Updating your progress...",
      description: "Redirecting you back to the learning path.",
    });
    
    // Improved navigation logic - always go back to learning path
    const isFromCourse = location.pathname.includes('/course/');
    if (embedded || isFromCourse) {
      const courseMatch = location.pathname.match(/\/course\/([^\/]+)/);
      if (courseMatch) {
        // Navigate to the learning path section of the course
        navigate(`/course/${courseMatch[1]}`, { replace: true });
      } else {
        navigate('/learning-hub', { replace: true });
      }
    } else {
      navigate('/learning-hub', { replace: true });
    }
    
    // Close modal if provided
    if (onClose) {
      onClose();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const hasAnsweredQuestions = questions ? 
    questions.some(q => studentAnswers[q.id] && studentAnswers[q.id].trim()) : false;

  const renderMainContent = () => {
    if (assessmentLoading) {
      return (
        <div className={embedded ? "p-2 sm:p-0" : "container py-8"}>
          <Skeleton className="h-8 w-64 mb-6 mx-auto sm:mx-0" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      );
    }

    if (assessmentError || !assessment) {
      return (
        <div className={embedded ? "p-2 sm:p-0" : "container py-8"}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center sm:text-left">Assessment Not Found</h1>
            <p className="text-gray-600 mb-6 text-center sm:text-left">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
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
      <div className={embedded ? "p-2 sm:p-0" : "container py-8"}>
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

        <Card className={embedded ? "mb-0 border-0 shadow-none rounded-none" : "mb-6"}>
          <CardHeader className={embedded ? "px-0 py-3" : ""}>
            <CardTitle className={embedded ? "text-lg sm:text-2xl text-center px-2 sm:px-0" : "text-2xl text-center"}>{assessment.title}</CardTitle>
          </CardHeader>
          <CardContent className={embedded ? "px-2 sm:px-0 pb-0" : ""}>
            {session ? (
              <>
                {/* Enhanced Progress Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{currentQuestionIndex + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Question {currentQuestionIndex + 1} of {questions?.length || 0}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {Math.round(((currentQuestionIndex + 1) / (questions?.length || 1)) * 100)}% Complete
                        </p>
                      </div>
                    </div>
                    
                    {/* Timer Section - Only show for timed assessments */}
                    {assessment.time_limit_minutes && (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3">
                        <AssessmentTimer 
                          timeRemaining={timeRemaining}
                          hasTimeLimit={!!assessment.time_limit_minutes}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${((currentQuestionIndex + 1) / (questions?.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {questionsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                        <div className="space-y-3">
                          <div className="h-6 bg-gray-200 rounded w-full"></div>
                          <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                          <div className="h-6 bg-gray-200 rounded w-4/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : questions && questions.length > 0 ? (
                  <div className="animate-fade-in">
                    <AssessmentQuestionCard
                      question={questions[currentQuestionIndex]}
                      studentAnswer={studentAnswers[questions[currentQuestionIndex].id] || ''}
                      onAnswerChange={handleAnswerChange}
                      isMarking={isMarking[questions[currentQuestionIndex].id]}
                      onMark={markCurrentQuestion}
                      feedback={feedback[questions[currentQuestionIndex].id]}
                      embedded={embedded}
                      isMarked={markedQuestions.has(questions[currentQuestionIndex].id)}
                    />

                    <AssessmentNavigation
                      currentQuestionIndex={currentQuestionIndex}
                      totalQuestions={questions.length}
                      onPrevious={goToPreviousQuestion}
                      onNext={goToNextQuestion}
                    />

                    {/* Single Complete Assessment Button - Always shown at bottom */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                        <AssessmentCompletion 
                          onComplete={completeAssessment}
                          isLoading={isCompletingAssessment}
                          hasAnsweredQuestions={hasAnsweredQuestions}
                        />
                        {isCompletingAssessment && (
                          <div className="mt-4 text-center">
                            <div className="flex items-center justify-center space-x-2 text-primary">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm font-medium">
                                Processing your answers and updating your learning path...
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No questions found for this assessment.</p>
                    <p className="text-gray-400 text-sm mt-2">Please check back later or contact support.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4 text-center">Ready to start the assessment?</p>
                <Button onClick={startAssessment} disabled={assessmentLoading}>
                  Start Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Dialog */}
        {completionScore && (
          <AssessmentCompletionDialog
            open={showCompletionDialog}
            onClose={() => setShowCompletionDialog(false)}
            onRetake={handleRetakeAssessment}
            onBackToCourse={handleBackToCourse}
            currentScore={completionScore}
            bestScore={bestScore}
            assessmentTitle={assessment.title}
            isFirstAttempt={!bestScore || bestScore.completed_sessions === 0}
            sessionId={session?.id} // Pass the session ID for improvement analysis
          />
        )}
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <div className="flex h-full">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <div className="container py-8">
                {renderMainContent()}
              </div>
            </main>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssessmentViewer;
