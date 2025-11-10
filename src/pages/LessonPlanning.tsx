import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { LessonPlanningScreen } from '@/components/cleo/LessonPlanningScreen';
import { LessonPlanDisplay } from '@/components/cleo/LessonPlanDisplay';
import { CleoInteractiveLearning } from '@/components/cleo/CleoInteractiveLearning';
import { useLessonPlan } from '@/hooks/useLessonPlan';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LessonPlanning: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [showPlanDisplay, setShowPlanDisplay] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

  const topic = searchParams.get('topic') || 'General Topic';
  const yearGroup = searchParams.get('yearGroup') || 'GCSE';
  const lessonId = searchParams.get('lessonId') || undefined;
  const moduleId = searchParams.get('moduleId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;

  // Generate or retrieve conversation ID to prevent duplicate lesson plans
  const [conversationId] = useState(() => {
    const urlConvId = searchParams.get('conversationId');
    if (urlConvId) return urlConvId;
    return uuidv4();
  });

  const { lessonPlan, contentBlocks, loading } = useLessonPlan(lessonPlanId);

  // Attempt to recover existing lesson plan by lessonId or topic+yearGroup on mount
  useEffect(() => {
    const loadExistingPlan = async () => {
      if (lessonPlanId) return;

      let data = null;

      // First try by lessonId
      if (lessonId) {
        const result = await supabase
          .from('cleo_lesson_plans')
          .select('id, teaching_sequence')
          .eq('lesson_id', lessonId)
          .maybeSingle();
        data = result.data;
      }

      // Fallback: try by topic + year_group
      if (!data) {
        const result = await supabase
          .from('cleo_lesson_plans')
          .select('id, teaching_sequence')
          .eq('topic', topic)
          .eq('year_group', yearGroup)
          .eq('status', 'ready')
          .maybeSingle();
        data = result.data;
      }

      if (data) {
        // For exam practice mode (11+), check compliance
        const subjectLower = topic.toLowerCase();
        const yearGroupLower = yearGroup?.toLowerCase() || '';
        const isExamPractice = subjectLower.includes('11 plus') || 
                              subjectLower.includes('11plus') || 
                              yearGroupLower.includes('11+') ||
                              yearGroupLower.includes('11 plus');
        
        if (isExamPractice) {
          // Validate compliance
          const steps = data.teaching_sequence || [];
          const hasTwoSteps = steps.length === 2;
          const practiceStep = steps.find((s: any) => 
            (s.title || '').toLowerCase().includes('practice')
          );
          const questionCount = practiceStep?.content_blocks?.filter(
            (b: any) => b.type === 'question'
          ).length || 0;
          
          if (hasTwoSteps && questionCount >= 20) {
            console.log('Recovered compliant exam practice plan:', data.id);
            setLessonPlanId(data.id);
            setShowLearning(true);
          } else {
            console.log(`Existing 11+ plan is non-compliant (steps: ${steps.length}, questions: ${questionCount}), showing planning screen`);
            // Don't set lessonPlanId - force fresh generation
          }
        } else {
          // Non-exam practice: use existing plan
          console.log('Recovered existing lesson plan:', data.id);
          setLessonPlanId(data.id);
          setShowLearning(true);
        }
      }
    };

    loadExistingPlan();
  }, [lessonId, lessonPlanId, topic, yearGroup]);

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

  // Show lesson plan display after generation
  if (showPlanDisplay && lessonPlan && !loading) {
    const contentCounts = {
      tables: contentBlocks.filter(b => b.type === 'table').length,
      questions: contentBlocks.filter(b => b.type === 'question').length,
      definitions: contentBlocks.filter(b => b.type === 'definition').length,
    };

    return (
      <LessonPlanDisplay
        lessonPlan={lessonPlan}
        contentCounts={contentCounts}
        onStartLesson={handleStartLesson}
        moduleId={moduleId}
        courseId={courseId}
      />
    );
  }

  if (showLearning) {
    // If we have a lesson plan, use it
    if (lessonPlan && contentBlocks.length > 0 && !loading) {
      return (
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
      );
    }

    // Fallback to simple mode if no plan
    return (
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
    );
  }

  return (
    <LessonPlanningScreen
      topic={topic}
      yearGroup={yearGroup}
      lessonId={lessonId}
      conversationId={conversationId}
      learningGoal={searchParams.get('goal') || undefined}
      onComplete={handlePlanningComplete}
      onError={handlePlanningError}
    />
  );
};

export default LessonPlanning;