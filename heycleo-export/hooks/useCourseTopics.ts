import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TopicOption {
  id: string;
  name: string;
  icon: string;
  position?: number;
}

const TOPIC_ICONS: Record<string, string> = {
  'motion': '🚀',
  'energy': '⚡',
  'forces': '🔧',
  'waves': '🌊',
  'electricity': '💡',
  'magnetism': '🧲',
  'atoms': '⚛️',
  'cells': '🧬',
  'genetics': '🧬',
  'evolution': '🦎',
  'ecology': '🌿',
  'chemistry': '🧪',
  'reactions': '⚗️',
  'algebra': '📐',
  'geometry': '📏',
  'statistics': '📊',
  'calculus': '∫',
  'default': '📚'
};

function getIconForTopic(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  for (const [key, icon] of Object.entries(TOPIC_ICONS)) {
    if (lowerTopic.includes(key)) {
      return icon;
    }
  }
  return TOPIC_ICONS.default;
}

export function useCourseTopics(courseId: string, moduleId?: string) {
  return useQuery({
    queryKey: ['course-topics', courseId, moduleId],
    queryFn: async () => {
      let lessons;
      
      if (moduleId) {
        // Fetch lessons for specific module
        const { data, error } = await supabase
          .from('course_lessons')
          .select('id, title, position')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });

        if (error) throw error;
        lessons = data || [];
      } else {
        // Fetch all lessons for the course
        const { data: modules, error: modulesError } = await supabase
          .from('course_modules')
          .select('id')
          .eq('course_id', courseId);

        if (modulesError) throw modulesError;
        if (!modules || modules.length === 0) return [];

        const moduleIds = modules.map(m => m.id);

        const { data, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('id, title, position')
          .in('module_id', moduleIds)
          .order('position', { ascending: true });

        if (lessonsError) throw lessonsError;
        lessons = data || [];
      }

      if (!lessons || lessons.length === 0) return [];

      // Return lessons as topics with their positions
      return lessons.map(lesson => ({
        id: lesson.id,
        name: lesson.title,
        icon: getIconForTopic(lesson.title),
        position: lesson.position
      }));
    },
    enabled: !!courseId
  });
}
