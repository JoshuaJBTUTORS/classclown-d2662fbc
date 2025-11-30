import { useQuery } from '@tanstack/react-query';
import { CourseModule } from '@/types/course';
import { personalizedLearningPathService } from '@/services/personalizedLearningPathService';
import { supabase } from '@/integrations/supabase/client';

interface UsePersonalizedLearningPathProps {
  courseId: string;
  modules: CourseModule[];
  enabled?: boolean;
}

export const usePersonalizedLearningPath = ({ 
  courseId, 
  modules, 
  enabled = true 
}: UsePersonalizedLearningPathProps) => {
  return useQuery({
    queryKey: ['personalized-learning-path', courseId, modules.map(m => m.id)],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { modules, isPersonalized: false, reason: 'No user authenticated' };
      }

      // Check cache first
      const cachedPath = await personalizedLearningPathService.getCachedPersonalizedPath(
        user.id, 
        courseId
      );
      
      if (cachedPath) {
        return cachedPath;
      }

      // Generate personalized path
      const personalizedOrder = await personalizedLearningPathService.getPersonalizedModuleOrder(
        courseId,
        modules,
        user.id
      );

      // Cache the result if personalized
      if (personalizedOrder.isPersonalized) {
        await personalizedLearningPathService.cachePersonalizedPath(
          user.id,
          courseId,
          personalizedOrder
        );
      }

      return personalizedOrder;
    },
    enabled: enabled && modules.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });
};