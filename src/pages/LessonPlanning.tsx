import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LessonPlanningScreen } from '@/components/cleo/LessonPlanningScreen';
import { CleoInteractiveLearning } from '@/components/cleo/CleoInteractiveLearning';
import { useLessonPlan } from '@/hooks/useLessonPlan';
import { useToast } from '@/hooks/use-toast';

const LessonPlanning: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);

  const topic = searchParams.get('topic') || 'General Topic';
  const yearGroup = searchParams.get('yearGroup') || 'GCSE';
  const lessonId = searchParams.get('lessonId') || undefined;
  const moduleId = searchParams.get('moduleId') || undefined;

  const { lessonPlan, contentBlocks, loading } = useLessonPlan(lessonPlanId);

  const handlePlanningComplete = (planId: string) => {
    console.log('Lesson plan generation complete. Plan ID:', planId);
    setLessonPlanId(planId);
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

  if (showLearning) {
    // Show loading state while fetching lesson plan data
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-background/95">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your lesson plan...</p>
          </div>
        </div>
      );
    }

    // If we have a lesson plan, use it
    if (lessonPlan && contentBlocks.length > 0) {
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
        />
      );
    }

    // Fallback to simple mode if no plan loaded
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
      />
    );
  }

  return (
    <LessonPlanningScreen
      topic={topic}
      yearGroup={yearGroup}
      lessonId={lessonId}
      learningGoal={searchParams.get('goal') || undefined}
      onComplete={handlePlanningComplete}
      onError={handlePlanningError}
    />
  );
};

export default LessonPlanning;