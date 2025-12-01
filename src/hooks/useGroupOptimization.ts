import { useState, useCallback } from 'react';
import { 
  findGroupOptimizations, 
  GroupOptimizationResult 
} from '@/services/groupOptimizationService';

interface UseGroupOptimizationReturn {
  result: GroupOptimizationResult | null;
  isLoading: boolean;
  error: string | null;
  optimize: (lessonId: string) => Promise<void>;
  reset: () => void;
}

export const useGroupOptimization = (): UseGroupOptimizationReturn => {
  const [result, setResult] = useState<GroupOptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (lessonId: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const optimizationResult = await findGroupOptimizations(lessonId);
      
      if (!optimizationResult) {
        setError('Failed to load lesson details');
        return;
      }

      setResult(optimizationResult);
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    isLoading,
    error,
    optimize,
    reset
  };
};
