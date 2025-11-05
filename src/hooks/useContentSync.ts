import { useState, useCallback, useEffect } from 'react';
import { LessonData, ContentEvent } from '@/types/lessonContent';

export const useContentSync = (lessonData: LessonData) => {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleContent, setVisibleContent] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const showContent = useCallback((contentId: string) => {
    console.log('📚 Showing content:', contentId);
    setVisibleContent((prev) => {
      if (prev.includes(contentId)) return prev;
      return [...prev, contentId];
    });
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
      }
    },
    [showContent, moveToNextStep, completeStep]
  );

  // Auto-show first visible content block on mount
  useEffect(() => {
    const firstVisible = lessonData.content?.find(c => c.visible);
    if (firstVisible && !visibleContent.includes(firstVisible.id)) {
      showContent(firstVisible.id);
    }
  }, [lessonData, showContent, visibleContent]);

  // Safety net: ensure first content shows after 300ms if nothing is visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (visibleContent.length === 0 && lessonData.content?.[0]) {
        console.log('⚠️ Safety fallback: showing first content');
        showContent(lessonData.content[0].id);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [visibleContent, lessonData.content, showContent]);

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
