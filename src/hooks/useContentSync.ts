import { useState, useCallback, useEffect, useRef } from 'react';
import { LessonData, ContentEvent } from '@/types/lessonContent';

export const useContentSync = (lessonData: LessonData, onStateChange?: (state: { activeStep: number; visibleContent: string[]; completedSteps: string[] }) => void) => {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleContent, setVisibleContent] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Refs to always have access to latest state values (fixes stale closure bug)
  const activeStepRef = useRef(activeStep);
  const visibleContentRef = useRef(visibleContent);

  // Keep refs in sync with state
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    visibleContentRef.current = visibleContent;
  }, [visibleContent]);

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
        case 'move_to_step':
          if (event.stepId) {
            console.log('📚 ========== PROCESSING MOVE_TO_STEP ==========');
            console.log('📚 Target step ID:', event.stepId);
            
            // Find all content blocks for this step
            const stepContent = lessonData.content
              .filter(block => block.stepId === event.stepId)
              .map(block => block.id);
            
            console.log('📚 Content blocks found for this step:', stepContent);
            console.log('📚 Number of blocks:', stepContent.length);
            
            if (stepContent.length === 0) {
              console.warn('⚠️ No content blocks found for step:', event.stepId);
            }
            
            // ✅ Only show the FIRST content block, not all
            if (stepContent.length > 0) {
              const firstContentId = stepContent[0];
              setVisibleContent(prev => {
                if (prev.includes(firstContentId)) {
                  console.log('📚 First block already visible:', firstContentId);
                  return prev;
                }
                console.log('📚 ➕ Showing FIRST content block only:', firstContentId);
                return [...prev, firstContentId];
              });
            }
            
            // Find current and previous step indices
            const stepIndex = lessonData.steps.findIndex(s => s.id === event.stepId);
            
            if (stepIndex >= 0) {
              // Auto-complete all previous steps
              const previousSteps = lessonData.steps.slice(0, stepIndex).map(s => s.id);
              setCompletedSteps(prev => {
                const newCompleted = [...prev];
                previousSteps.forEach(stepId => {
                  if (!newCompleted.includes(stepId)) {
                    newCompleted.push(stepId);
                    console.log('✅ Auto-completing previous step:', stepId);
                  }
                });
                return newCompleted;
              });
              
              // Set as active step
              setActiveStep(stepIndex);
              console.log('📚 ✅ Active step set to:', stepIndex);
            } else {
              console.warn('📚 ⚠️ Step not found in lesson steps!');
            }
          } else {
            console.error('❌ move_to_step event missing stepId!');
          }
          break;
        
        case 'show_next_content':
          // Use refs to get LATEST state values (fixes stale closure bug)
          const currentActiveStep = activeStepRef.current;
          const currentVisibleContent = visibleContentRef.current;
          
          console.log('📚 ========== PROCESSING SHOW_NEXT_CONTENT ==========');
          console.log('📚 Current activeStep (from ref):', currentActiveStep);
          console.log('📚 Current visibleContent (from ref):', currentVisibleContent);
          
          const currentStepId = lessonData.steps[currentActiveStep]?.id;
          if (currentStepId) {
            const currentStepContent = lessonData.content
              .filter(block => block.stepId === currentStepId)
              .map(block => block.id);
            
            console.log('📚 Content blocks for current step:', currentStepContent);
            
            // Find the first unrevealed content block in this step
            const nextContentId = currentStepContent.find(id => !currentVisibleContent.includes(id));
            
            if (nextContentId) {
              console.log('📚 ➕ show_next_content: Revealing:', nextContentId);
              setVisibleContent(prev => [...prev, nextContentId]);
            } else {
              console.log('📚 ℹ️ show_next_content: All content for step already visible');
              console.log('📚 Looking for content in NEXT step...');
              
              // Try to find content in the next step
              const nextStepIndex = currentActiveStep + 1;
              if (nextStepIndex < lessonData.steps.length) {
                const nextStepId = lessonData.steps[nextStepIndex]?.id;
                const nextStepContent = lessonData.content
                  .filter(block => block.stepId === nextStepId)
                  .map(block => block.id);
                
                const firstNextStepContent = nextStepContent.find(id => !currentVisibleContent.includes(id));
                if (firstNextStepContent) {
                  console.log('📚 ➕ Revealing first content of next step:', firstNextStepContent);
                  setVisibleContent(prev => [...prev, firstNextStepContent]);
                  setActiveStep(nextStepIndex);
                }
              }
            }
          } else {
            console.warn('📚 ⚠️ No current step ID found for activeStep:', currentActiveStep);
          }
          break;
        case 'lesson_complete':
          console.log('🎓 Lesson completion signaled by AI');
          // Mark ALL steps as completed
          const allStepIds = lessonData.steps.map(s => s.id);
          setCompletedSteps(allStepIds);
          console.log('✅ All steps marked complete:', allStepIds);
          break;
      }
    },
    [showContent, moveToNextStep, completeStep, lessonData]
  );

  // Content visibility is now controlled by move_to_step events from Cleo
  // No auto-show on mount - rules card displays first

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({
      activeStep,
      visibleContent,
      completedSteps,
    });
  }, [activeStep, visibleContent, completedSteps, onStateChange]);

  return {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    completeStep,
    moveToNextStep,
    handleContentEvent,
    setActiveStep,
    setVisibleContent,
    setCompletedSteps,
  };
};
