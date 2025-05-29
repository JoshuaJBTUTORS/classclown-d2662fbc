import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService, AssessmentQuestion, AssessmentSession, StudentResponse } from '@/services/aiAssessmentService';

interface AIAssessmentViewerProps {
  assessmentId: string;
}

const AIAssessmentViewer: React.FC<AIAssessmentViewerProps> = ({ assessmentId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [session, setSession] = useState<AssessmentSession | null>(null);

  // Fetch assessment details
  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => aiAssessmentService.getAssessmentById(assessmentId),
  });

  // Fetch questions
  const { data: questions = [] } = useQuery({
    queryKey: ['assessmentQuestions', assessmentId],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(assessmentId),
    enabled: !!assessmentId,
  });

  // Fetch or create session
  const { data: existingSession } = useQuery({
    queryKey: ['userSession', assessmentId],
    queryFn: () => aiAssessmentService.getUserSession(assessmentId),
    enabled: !!assessmentId,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => aiAssessmentService.createAssessmentSession(assessmentId),
    onSuccess: (newSession) => {
      setSession(newSession);
      queryClient.invalidateQueries({ queryKey: ['userSession', assessmentId] });
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      aiAssessmentService.submitAnswer(session!.id, questionId, answer),
    onSuccess: () => {
      toast({
        title: "Answer saved",
        description: "Your answer has been saved automatically",
      });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: () => aiAssessmentService.completeSession(session!.id),
    onSuccess: () => {
      // Mark answers with AI
      markAnswersMutation.mutate();
    },
  });

  // Mark answers mutation
  const markAnswersMutation = useMutation({
    mutationFn: () => aiAssessmentService.markAnswers(session!.id),
    onSuccess: () => {
      toast({
        title: "Assessment completed",
        description: "Your answers have been marked and feedback is available",
      });
      queryClient.invalidateQueries({ queryKey: ['userSession', assessmentId] });
    },
  });

  // Set up session on component mount
  useEffect(() => {
    if (existingSession) {
      setSession(existingSession);
      if (existingSession.status === 'completed') {
        // Show results view
        return;
      }
    }
  }, [existingSession]);

  // Timer effect
  useEffect(() => {
    if (session && assessment?.time_limit_minutes && session.status === 'in_progress') {
      const startTime = new Date(session.started_at).getTime();
      const timeLimit = assessment.time_limit_minutes * 60 * 1000;
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleCompleteAssessment();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, assessment]);

  const handleStartAssessment = () => {
    createSessionMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Auto-save after 2 seconds of no typing
    if (session) {
      const timeoutId = setTimeout(() => {
        submitAnswerMutation.mutate({ questionId, answer });
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && session && answers[currentQuestion.id]) {
      submitAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answer: answers[currentQuestion.id],
      });
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteAssessment = () => {
    if (session) {
      completeSessionMutation.mutate();
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!assessment) {
    return <div className="p-8 text-center">Loading assessment...</div>;
  }

  // Pre-assessment view
  if (!session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assessment.title}
          </CardTitle>
          {assessment.description && (
            <p className="text-gray-600">{assessment.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {assessment.subject && (
              <div>
                <span className="font-medium">Subject:</span> {assessment.subject}
              </div>
            )}
            {assessment.exam_board && (
              <div>
                <span className="font-medium">Exam Board:</span> {assessment.exam_board}
              </div>
            )}
            <div>
              <span className="font-medium">Total Marks:</span> {assessment.total_marks}
            </div>
            {assessment.time_limit_minutes && (
              <div>
                <span className="font-medium">Time Limit:</span> {assessment.time_limit_minutes} minutes
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              This assessment will be automatically marked by AI. Make sure you have a stable internet connection.
            </p>
          </div>

          <Button 
            onClick={handleStartAssessment} 
            disabled={createSessionMutation.isPending}
            className="w-full"
          >
            {createSessionMutation.isPending ? 'Starting...' : 'Start Assessment'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Assessment in progress
  if (session.status === 'in_progress' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-red-600">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <Progress value={progress} className="w-full" />

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>Question {currentQuestion.question_number}</span>
              <Badge variant="outline">{currentQuestion.marks_available} mark{currentQuestion.marks_available !== 1 ? 's' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p>{currentQuestion.question_text}</p>
            </div>
            
            {currentQuestion.image_url && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={currentQuestion.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded"
                />
              </div>
            )}
            
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer here..."
              rows={6}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleCompleteAssessment}
                disabled={completeSessionMutation.isPending}
              >
                {completeSessionMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assessment completed - show results
  if (session.status === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Assessment Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {session.total_marks_achieved} / {session.total_marks_available}
            </div>
            <p className="text-gray-600">
              {Math.round((session.total_marks_achieved / session.total_marks_available) * 100)}%
            </p>
          </div>
          
          <p className="text-center text-gray-600">
            AI feedback and detailed results will be available shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <div className="p-8 text-center">Loading...</div>;
};

export default AIAssessmentViewer;
