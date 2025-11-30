// Hook for managing Cleo lesson state

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LessonState, cleoLessonStateService } from '@/services/cleoLessonStateService';

interface UseCleoLessonStateReturn {
  savedState: LessonState | null;
  isLoading: boolean;
  save: (state: Partial<LessonState> & { conversation_id: string }) => Promise<void>;
  debouncedSave: (state: Partial<LessonState> & { conversation_id: string }) => void;
  markPaused: () => Promise<void>;
  markCompleted: () => Promise<void>;
  clearPause: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCleoLessonState(conversationId: string | null): UseCleoLessonStateReturn {
  const [savedState, setSavedState] = useState<LessonState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<(Partial<LessonState> & { conversation_id: string }) | null>(null);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      if (!conversationId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const state = await cleoLessonStateService.getState(conversationId);
      setSavedState(state);
      setIsLoading(false);
    };

    loadState();
  }, [conversationId]);

  const save = useCallback(async (state: Partial<LessonState> & { conversation_id: string }) => {
    await cleoLessonStateService.saveState(state);
    setSavedState(prev => prev ? { ...prev, ...state } : state as LessonState);
  }, []);

  const debouncedSave = useCallback((state: Partial<LessonState> & { conversation_id: string }) => {
    pendingStateRef.current = state;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingStateRef.current) {
        await save(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }, 1000); // Debounce 1 second
  }, [save]);

  const markPaused = useCallback(async () => {
    if (!conversationId) return;
    await cleoLessonStateService.markPaused(conversationId);
    setSavedState(prev => prev ? { ...prev, paused_at: new Date().toISOString() } : null);
  }, [conversationId]);

  const markCompleted = useCallback(async () => {
    if (!conversationId) return;
    await cleoLessonStateService.markCompleted(conversationId);
    setSavedState(prev => prev ? { 
      ...prev, 
      completed_at: new Date().toISOString(),
      completion_percentage: 100,
      paused_at: undefined,
    } : null);
  }, [conversationId]);

  const clearPause = useCallback(async () => {
    if (!conversationId) return;
    await cleoLessonStateService.clearPause(conversationId);
    setSavedState(prev => prev ? { ...prev, paused_at: undefined } : null);
  }, [conversationId]);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    const state = await cleoLessonStateService.getState(conversationId);
    setSavedState(state);
  }, [conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    savedState,
    isLoading,
    save,
    debouncedSave,
    markPaused,
    markCompleted,
    clearPause,
    refresh,
  };
}
