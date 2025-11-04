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
    console.log('Lesson plan generated:', planId);
    setLessonPlanId(planId);
    setShowLearning(true);
  };

  const handlePlanningError = (error: string) => {
    console.error('Planning error:', error);
    toast({
      title: 'Planning Failed',
      description: error,
      variant: 'destructive'
    });
    // Fallback to original flow
    setShowLearning(true);
  };

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