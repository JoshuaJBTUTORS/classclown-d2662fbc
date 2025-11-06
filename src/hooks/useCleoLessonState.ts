import { useState, useEffect, useCallback, useRef } from 'react';
import { cleoLessonStateService, LessonState } from '@/services/cleoLessonStateService';
import { toast } from 'sonner';

export const useCleoLessonState = (conversationId: string | null) => {
  const [savedState, setSavedState] = useState<LessonState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load saved state on mount
  useEffect(() => {
    if (!conversationId) return;

    const loadState = async () => {
      try {
        const state = await cleoLessonStateService.loadLessonState(conversationId);
        setSavedState(state);
        if (state) {
          setCompletionPercentage(state.completion_percentage);
        }
      } catch (error) {
        console.error('Failed to load lesson state:', error);
      }
    };

    loadState();
  }, [conversationId]);

  const saveState = useCallback(async (state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!conversationId) return;

    setIsSaving(true);
    try {
      await cleoLessonStateService.saveLessonState(state);
      setSavedState(prev => ({ ...prev, ...state } as LessonState));
    } catch (error) {
      console.error('Failed to save lesson state:', error);
    } finally {
      setIsSaving(false);
    }
  }, [conversationId]);

  const debouncedSave = useCallback((state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState(state);
    }, 2000); // Debounce for 2 seconds
  }, [saveState]);

  const loadState = useCallback(async () => {
    if (!conversationId) return null;

    try {
      const state = await cleoLessonStateService.loadLessonState(conversationId);
      setSavedState(state);
      if (state) {
        setCompletionPercentage(state.completion_percentage);
      }
      return state;
    } catch (error) {
      console.error('Failed to load lesson state:', error);
      toast.error('Failed to load lesson progress');
      return null;
    }
  }, [conversationId]);

  const pauseLesson = useCallback(async (state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!conversationId) return;

    try {
      await cleoLessonStateService.pauseLesson(conversationId, state);
      toast.success('Lesson paused. You can resume anytime.');
    } catch (error) {
      console.error('Failed to pause lesson:', error);
      toast.error('Failed to pause lesson');
    }
  }, [conversationId]);

  const resumeLesson = useCallback(async () => {
    if (!conversationId) return null;

    try {
      const state = await cleoLessonStateService.resumeLesson(conversationId);
      setSavedState(state);
      if (state) {
        setCompletionPercentage(state.completion_percentage);
        toast.success('Lesson resumed');
      }
      return state;
    } catch (error) {
      console.error('Failed to resume lesson:', error);
      toast.error('Failed to resume lesson');
      return null;
    }
  }, [conversationId]);

  const completeLesson = useCallback(async (state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!conversationId) return;

    try {
      await cleoLessonStateService.completeLesson(conversationId, state);
      setCompletionPercentage(100);
      toast.success('Lesson completed! 🎉');
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      toast.error('Failed to mark lesson as complete');
    }
  }, [conversationId]);

  const clearState = useCallback(async () => {
    if (!conversationId) return;

    try {
      await cleoLessonStateService.clearLessonState(conversationId);
      setSavedState(null);
      setCompletionPercentage(0);
    } catch (error) {
      console.error('Failed to clear lesson state:', error);
    }
  }, [conversationId]);

  return {
    savedState,
    isSaving,
    completionPercentage,
    saveState,
    debouncedSave,
    loadState,
    pauseLesson,
    resumeLesson,
    completeLesson,
    clearState,
  };
};
