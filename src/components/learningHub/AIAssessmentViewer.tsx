import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService, AssessmentQuestion } from '@/services/aiAssessmentService';
import { useAuth } from '@/contexts/AuthContext';
import AssessmentAccessControl from './AssessmentAccessControl';
import QuestionFeedback from './QuestionFeedback';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const { mutate: submitAnswer } = useMutation({
    mutationFn: ({ sessionId, questionId, answer }: { sessionId: string, questionId: string, answer: string }) =>
      aiAssessmentService.submitAnswer(sessionId, questionId, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionResponses', session?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting answer",
        description: error.message || "Failed to submit the answer.",
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
    mutationFn: ({ sessionId, questionId, answer }: { sessionId: string, questionId: string, answer: string }) =>
      aiAssessmentService.markSingleQuestion(sessionId, questionId, answer),
    onSuccess: (data, variables) => {
      setFeedback(prev => ({
        ...prev,
        [variables.questionId]: data,
      }));
      setIsMarking(prev => ({
        ...prev,
        [variables.questionId]: false,
      }));
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error marking question",
        description: error.message || "Failed to mark the question.",
        variant: "destructive",
      });
      setIsMarking(prev => ({
        ...prev,
        [variables.questionId]: false,
      }));
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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setStudentAnswers({ ...studentAnswers, [questionId]: answer });
  };

  const submitCurrentAnswer = async () => {
    if (!session) return;
    setIsSubmitting(true);
    const question = questions![currentQuestionIndex];
    const answer = studentAnswers[question.id] || '';

    submitAnswer({ sessionId: session.id, questionId: question.id, answer });
    setIsSubmitting(false);
  };

  const markCurrentQuestion = async () => {
    if (!session) return;
    const question = questions![currentQuestionIndex];
    const answer = studentAnswers[question.id] || '';

    setIsMarking(prev => ({
      ...prev,
      [question.id]: true,
    }));

    markQuestion({ sessionId: session.id, questionId: question.id, answer });
  };

  const goToNextQuestion = () => {
    submitCurrentAnswer();
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    submitCurrentAnswer();
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
                {assessment.time_limit_minutes && timeRemaining !== null ? (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      Time Remaining: {formatTime(timeRemaining)}
                    </div>
                    <Button variant="destructive" size="sm" onClick={completeAssessment}>
                      Complete Assessment
                    </Button>
                  </div>
                ) : null}

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

                    <QuestionCard
                      question={questions[currentQuestionIndex]}
                      studentAnswer={studentAnswers[questions[currentQuestionIndex].id] || ''}
                      onAnswerChange={handleAnswerChange}
                      isSubmitting={isSubmitting}
                      onSubmit={submitCurrentAnswer}
                      isMarking={isMarking[questions[currentQuestionIndex].id]}
                      onMark={markCurrentQuestion}
                      feedback={feedback[questions[currentQuestionIndex].id]}
                    />

                    <div className="flex justify-between mt-4">
                      <Button
                        variant="secondary"
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={goToNextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
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

interface QuestionCardProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  isMarking?: boolean;
  onMark?: () => void;
  feedback?: any;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  studentAnswer,
  onAnswerChange,
  isSubmitting,
  onSubmit,
  isMarking = false,
  onMark,
  feedback,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Question {question.question_number} ({question.marks_available} marks)
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{question.question_text}</p>
        
        {/* Display question image if it exists */}
        {question.image_url && (
          <div className="my-4">
            <img 
              src={question.image_url} 
              alt={`Question ${question.question_number} image`}
              className="max-w-full h-auto rounded-lg shadow-sm border"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}
        
        {question.question_type === 'multiple_choice' ? (
          <MultipleChoiceQuestion
            question={question}
            studentAnswer={studentAnswer}
            onAnswerChange={onAnswerChange}
          />
        ) : (
          <Textarea
            placeholder="Enter your answer here..."
            value={studentAnswer}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            disabled={isSubmitting}
          />
        )}
        <div className="flex justify-between">
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={onMark} 
            disabled={isMarking}
          >
            {isMarking ? 'Marking...' : 'Mark Answer'}
          </Button>
        </div>
        <QuestionFeedback feedback={feedback} isLoading={isMarking} />
      </CardContent>
    </Card>
  );
};

interface MultipleChoiceQuestionProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  studentAnswer,
  onAnswerChange,
}) => {
  const choices = question.marking_scheme?.choices || ['A', 'B', 'C', 'D'];

  return (
    <RadioGroup
      defaultValue={studentAnswer}
      onValueChange={(value) => onAnswerChange(question.id, value)}
    >
      <div className="grid gap-2">
        {choices.map((choice: string) => (
          <div className="flex items-center space-x-2" key={choice}>
            <RadioGroupItem value={choice} id={`choice-${choice}`} />
            <Label htmlFor={`choice-${choice}`}>{choice}</Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
};

export default AIAssessmentViewer;
