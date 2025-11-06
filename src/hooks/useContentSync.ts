import { useState, useCallback, useEffect } from 'react';
import { LessonData, ContentEvent } from '@/types/lessonContent';

export const useContentSync = (lessonData: LessonData) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Show all content immediately
  const visibleContent = lessonData.content.map(block => block.id);

  const showContent = useCallback((contentId: string) => {
    console.log('📚 Content already visible:', contentId);
    // All content is already visible, this is a no-op
  }, []);

  const completeStep = useCallback((stepId: string) => {
    console.log('✅ Completing step:', stepId);
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      return [...prev, stepId];
    });
  }, []);

  const moveToNextStep = useCallback(() => {
    console.log('➡️ Moving to next step');
    setActiveStep((prev) => Math.min(prev + 1, lessonData.steps.length - 1));
  }, [lessonData.steps.length]);

  const handleContentEvent = useCallback(
    (event: ContentEvent) => {
      console.log('📢 Content event received:', event);
      
      switch (event.type) {
        case 'show_content':
          if (event.contentId) {
            showContent(event.contentId);
          }
          break;
        case 'next_step':
          moveToNextStep();
          break;
        case 'complete_step':
          if (event.stepId) {
            completeStep(event.stepId);
            moveToNextStep();
          }
          break;
        case 'ask_question':
          if (event.questionId) {
            showContent(event.questionId);
          }
          break;
        case 'move_to_step':
          if (event.stepId) {
            const stepIndex = lessonData.steps.findIndex(s => s.id === event.stepId);
            if (stepIndex >= 0) {
              setActiveStep(stepIndex);
              console.log('📚 Active step set to:', stepIndex);
            }
          }
          break;
      }
    },
    [showContent, moveToNextStep, completeStep, lessonData]
  );

  return {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    completeStep,
    moveToNextStep,
    handleContentEvent,
  };
};
