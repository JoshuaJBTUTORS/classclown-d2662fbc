import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HeyCleoHomeworkRow } from '@/hooks/useHeyCleoStudents';

/**
 * Recent HeyCleo homework for a single HeyCleo student id (most recent first).
 */
export function useHeyCleoStudentHomework(heycleoStudentId?: string | null, limit = 10) {
  return useQuery({
    queryKey: ['heycleo-student-homework', heycleoStudentId, limit],
    enabled: !!heycleoStudentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HeyCleoHomeworkRow[]> => {
      const { data, error } = await supabase
        .from('heycleo_homework_completion')
        .select('*')
        .eq('student_id', heycleoStudentId as string)
        .order('due_date', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as HeyCleoHomeworkRow[];
    },
  });
}
