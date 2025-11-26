import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { LessonPlanningScreen } from '@/components/cleo/LessonPlanningScreen';
import { LessonPlanDisplay } from '@/components/cleo/LessonPlanDisplay';
import { CleoInteractiveLearning } from '@/components/cleo/CleoInteractiveLearning';
import { DifficultySelectionScreen } from '@/components/cleo/DifficultySelectionScreen';
import { useLessonPlan } from '@/hooks/useLessonPlan';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft } from 'lucide-react';

const LessonPlanning: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [showPlanDisplay, setShowPlanDisplay] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [showLearnAgainDialog, setShowLearnAgainDialog] = useState(false);
  const [completedDate, setCompletedDate] = useState<string | null>(null);

  const topic = searchParams.get('topic') || 'General Topic';
  const yearGroup = searchParams.get('yearGroup') || 'GCSE';
  const lessonId = searchParams.get('lessonId') || undefined;
  const moduleId = searchParams.get('moduleId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;
  const isCompletedParam = searchParams.get('isCompleted') === 'true';
  const difficultyTier = searchParams.get('difficultyTier') as 'foundation' | 'intermediate' | 'higher' | null;

  // Generate or retrieve conversation ID to prevent duplicate lesson plans
  const [conversationId] = useState(() => {
    const urlConvId = searchParams.get('conversationId');
    if (urlConvId) return urlConvId;
    return uuidv4();
  });

  const { lessonPlan, contentBlocks, loading } = useLessonPlan(lessonPlanId);

  // Check if lesson is completed on mount
  useEffect(() => {
    const checkCompletion = async () => {
      if (!lessonId || !isCompletedParam) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('student_progress')
        .select('id, completed_at')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('status', 'completed')
        .maybeSingle();
      
      if (data && !error) {
        setIsLessonCompleted(true);
        setCompletedDate(data.completed_at);
        setShowLearnAgainDialog(true);
      }
    };
    checkCompletion();
  }, [lessonId, isCompletedParam]);

  // Attempt to recover existing lesson plan by lessonId or topic+yearGroup on mount
  useEffect(() => {
    const loadExistingPlan = async () => {
      // Don't auto-load if no difficulty tier is selected yet
      if (!difficultyTier) return;
      if (lessonPlanId) return;

      let data = null;
      
      // Get user's exam board preference for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('exam_boards')
        .eq('id', user.id)
        .single();
      
      let userExamBoard: string | null = null;
      
      // Determine user's exam board for this course if lessonId is available
      if (lessonId && profile?.exam_boards) {
        const { data: lessonData } = await supabase
          .from('course_lessons')
          .select(`
            course_modules!inner(
              courses!inner(
                subject,
                exam_board_specification_id
              )
            )
          `)
          .eq('id', lessonId)
          .single();
        
        const courseSubject = lessonData?.course_modules?.courses?.subject;
        
        // Get subject ID to look up user's exam board
        if (courseSubject) {
          const { data: subjectData } = await supabase
            .from('subjects')
            .select('id')
            .ilike('name', courseSubject)
            .single();
          
          if (subjectData?.id) {
            userExamBoard = profile.exam_boards[subjectData.id] || null;
            console.log('User exam board preference:', userExamBoard);
          }
        }
      }

      // First try by lessonId + exam board + difficulty tier
      if (lessonId && userExamBoard && difficultyTier) {
        const result = await supabase
          .from('cleo_lesson_plans')
          .select('id, teaching_sequence')
          .eq('lesson_id', lessonId)
          .eq('exam_board', userExamBoard)
          .eq('difficulty_tier', difficultyTier)
          .eq('status', 'ready')
          .maybeSingle();
        data = result.data;
        console.log('Searched for lesson plan with exam board + tier:', userExamBoard, difficultyTier, 'found:', !!data);
      }
      
      // Fallback: try by lessonId + difficulty tier (any exam board)
      if (!data && lessonId && difficultyTier) {
        const result = await supabase
          .from('cleo_lesson_plans')
          .select('id, teaching_sequence')
          .eq('lesson_id', lessonId)
          .eq('difficulty_tier', difficultyTier)
          .eq('status', 'ready')
          .maybeSingle();
        data = result.data;
        console.log('Fallback: Searched for lesson plan with tier (any exam board):', difficultyTier, 'found:', !!data);
      }

      if (data) {
        console.log('Recovered existing lesson plan:', data.id);
        setLessonPlanId(data.id);
        setShowLearning(true);
      }
    };

    loadExistingPlan();
  }, [lessonId, lessonPlanId, topic, yearGroup, difficultyTier]);

  const handlePlanningComplete = (planId: string) => {
    console.log('Lesson plan generated:', planId);
    setLessonPlanId(planId);
    setShowPlanDisplay(true);
  };

  const handleStartLesson = () => {
    setShowPlanDisplay(false);
    setShowLearning(true);
  };

  const handlePlanningError = (error: string) => {
    console.error('Planning error:', error);
    
    // Provide user-friendly messages based on error type
    let title = 'Planning Failed';
    let description = error;
    
    if (error.includes('Unauthorized') || error.includes('sign in')) {
      title = 'Authentication Required';
      description = 'Please sign in to generate lesson plans';
    } else if (error.includes('Rate limits exceeded')) {
      title = 'Rate Limit Reached';
      description = 'Too many requests. Please try again in a few minutes.';
    } else if (error.includes('Payment required') || error.includes('credits')) {
      title = 'Credits Required';
      description = 'Please add Lovable AI credits to your workspace to continue.';
    }
    
    toast({
      title,
      description,
      variant: 'destructive'
    });
    
    // Only fallback to original flow if not an auth error
    if (!error.includes('Unauthorized') && !error.includes('sign in')) {
      setShowLearning(true);
    }
  };

  // Show difficulty selection FIRST if no difficulty tier is selected
  if (!difficultyTier && lessonId) {
    return (
      <DifficultySelectionScreen
        topic={topic}
        courseId={courseId || ''}
        moduleId={moduleId || ''}
        lessonId={lessonId}
        yearGroup={yearGroup}
        isCompleted={isCompletedParam}
        subjectName={yearGroup}
      />
    );
  }

  // Show lesson plan display after generation
  if (showPlanDisplay && lessonPlan && !loading) {
    const contentCounts = {
      tables: contentBlocks.filter(b => b.type === 'table').length,
      questions: contentBlocks.filter(b => b.type === 'question').length,
      definitions: contentBlocks.filter(b => b.type === 'definition').length,
    };

    return (
      <>
        {/* Learn Again Dialog */}
        <Dialog open={showLearnAgainDialog} onOpenChange={setShowLearnAgainDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>You've completed this lesson! 🎉</DialogTitle>
              <DialogDescription>
                You completed "{topic}" {completedDate ? `on ${new Date(completedDate).toLocaleDateString()}` : 'previously'}. 
                Would you like to learn it again or go back?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button 
                onClick={() => {
                  setShowLearnAgainDialog(false);
                  setShowLearning(true);
                }}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Learn Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/course/${courseId}/module/${moduleId}`)}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <LessonPlanDisplay
          lessonPlan={lessonPlan}
          contentCounts={contentCounts}
          onStartLesson={handleStartLesson}
          moduleId={moduleId}
          courseId={courseId}
        />
      </>
    );
  }

  if (showLearning) {
    // If we have a lesson plan, use it
    if (lessonPlan && contentBlocks.length > 0 && !loading) {
      return (
        <>
          {/* Learn Again Dialog */}
          <Dialog open={showLearnAgainDialog} onOpenChange={setShowLearnAgainDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>You've completed this lesson! 🎉</DialogTitle>
                <DialogDescription>
                  You completed "{topic}" {completedDate ? `on ${new Date(completedDate).toLocaleDateString()}` : 'previously'}. 
                  Would you like to learn it again or go back?
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-4">
                <Button 
                  onClick={() => {
                    setShowLearnAgainDialog(false);
                  }}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Learn Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/course/${courseId}/module/${moduleId}`)}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Module
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <CleoInteractiveLearning
            lessonData={{
              id: lessonId || lessonPlan.id,
              title: topic,
              topic: topic,
              yearGroup: lessonPlan.year_group,
              steps: lessonPlan.teaching_sequence.map((step, index) => ({
                id: step.id,
                order: index + 1,
                title: step.title,
                completed: false
              })),
              content: contentBlocks
            }}
            lessonPlan={lessonPlan}
            moduleId={moduleId}
            courseId={courseId}
          />
        </>
      );
    }

    // Fallback to simple mode if no plan
    return (
      <>
        {/* Learn Again Dialog */}
        <Dialog open={showLearnAgainDialog} onOpenChange={setShowLearnAgainDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>You've completed this lesson! 🎉</DialogTitle>
              <DialogDescription>
                You completed "{topic}" {completedDate ? `on ${new Date(completedDate).toLocaleDateString()}` : 'previously'}. 
                Would you like to learn it again or go back?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button 
                onClick={() => {
                  setShowLearnAgainDialog(false);
                }}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Learn Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/course/${courseId}/module/${moduleId}`)}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <CleoInteractiveLearning
          lessonData={{
            id: lessonId || 'fallback',
            title: topic,
            topic: topic,
            yearGroup: yearGroup,
            steps: [
              { id: 'intro', order: 1, title: 'Introduction', completed: false },
              { id: 'main', order: 2, title: 'Main Content', completed: false },
            ],
            content: []
          }}
          lessonPlan={{
            id: 'fallback-lesson',
            topic: topic,
            year_group: yearGroup,
            learning_objectives: [],
            teaching_sequence: [
              { id: 'intro', title: 'Introduction', duration_minutes: 10 },
              { id: 'main', title: 'Main Content', duration_minutes: 20 },
            ]
          }}
          moduleId={moduleId}
          courseId={courseId}
        />
      </>
    );
  }

  return (
    <LessonPlanningScreen
      topic={topic}
      yearGroup={yearGroup}
      lessonId={lessonId}
      conversationId={conversationId}
      learningGoal={searchParams.get('goal') || undefined}
      difficultyTier={difficultyTier || 'intermediate'}
      onComplete={handlePlanningComplete}
      onError={handlePlanningError}
    />
  );
};

export default LessonPlanning;