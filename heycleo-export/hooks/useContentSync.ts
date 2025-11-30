// Hook for syncing lesson content state

import { useState, useCallback, useEffect } from 'react';
import { LessonData, ContentEvent } from '@/types/lessonContent';

interface ContentState {
  activeStep: number;
  visibleContent: string[];
  completedSteps: string[];
}

interface UseContentSyncReturn {
  activeStep: number;
  visibleContent: string[];
  completedSteps: string[];
  showContent: (contentId: string) => void;
  handleContentEvent: (event: ContentEvent) => void;
  setActiveStep: (step: number) => void;
  setVisibleContent: (ids: string[]) => void;
  setCompletedSteps: (steps: string[]) => void;
}

export function useContentSync(
  lessonData: LessonData,
  onStateChange?: (state: ContentState) => void
): UseContentSyncReturn {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleContent, setVisibleContent] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({
      activeStep,
      visibleContent,
      completedSteps,
    });
  }, [activeStep, visibleContent, completedSteps, onStateChange]);

  const showContent = useCallback((contentId: string) => {
    setVisibleContent(prev => {
      if (prev.includes(contentId)) return prev;
      return [...prev, contentId];
    });
  }, []);

  const handleContentEvent = useCallback((event: ContentEvent) => {
    console.log('📍 Content event:', event.type, event);

    switch (event.type) {
      case 'move_to_step':
        if (event.stepId) {
          const stepIndex = lessonData.steps.findIndex(s => s.id === event.stepId);
          if (stepIndex !== -1) {
            setActiveStep(stepIndex);
            
            // Show all content blocks for this step
            const stepContentIds = lessonData.content
              .filter(c => c.stepId === event.stepId)
              .map(c => c.id);
            
            setVisibleContent(prev => {
              const newIds = stepContentIds.filter(id => !prev.includes(id));
              return [...prev, ...newIds];
            });
          }
        }
        break;

      case 'show_content':
        if (event.contentId) {
          showContent(event.contentId);
        }
        break;

      case 'complete_step':
        if (event.stepId) {
          setCompletedSteps(prev => {
            if (prev.includes(event.stepId!)) return prev;
            return [...prev, event.stepId!];
          });
        }
        break;

      case 'lesson_complete':
        // Mark all steps as completed
        setCompletedSteps(lessonData.steps.map(s => s.id));
        break;

      case 'upsert_content':
        // Content upsert is handled elsewhere - this just tracks visibility
        if (event.block && event.autoShow) {
          showContent(event.block.id);
        }
        break;
    }
  }, [lessonData, showContent]);

  return {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    handleContentEvent,
    setActiveStep,
    setVisibleContent,
    setCompletedSteps,
  };
}
