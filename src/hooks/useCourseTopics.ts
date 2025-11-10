import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TopicOption {
  id: string;
  name: string;
  icon: string;
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

export function useCourseTopics(courseId: string) {
  return useQuery({
    queryKey: ['course-topics', courseId],
    queryFn: async () => {
      // Fetch all lessons for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;
      if (!modules || modules.length === 0) return [];

      const moduleIds = modules.map(m => m.id);

      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('id, title')
        .in('module_id', moduleIds);

      if (lessonsError) throw lessonsError;
      if (!lessons || lessons.length === 0) return [];

      // Extract unique topics
      const topicsMap = new Map<string, TopicOption>();

      lessons.forEach(lesson => {
        let topicName: string;

        // Extract topic from title (e.g., "Motion: Newton's Laws" -> "Motion")
        const colonIndex = lesson.title.indexOf(':');
        if (colonIndex > 0) {
          topicName = lesson.title.substring(0, colonIndex).trim();
        } else {
          // Use the full title if no colon
          topicName = lesson.title;
        }

        // Only add if we don't already have this topic
        if (!topicsMap.has(topicName)) {
          topicsMap.set(topicName, {
            id: topicName.toLowerCase().replace(/\s+/g, '-'),
            name: topicName,
            icon: getIconForTopic(topicName)
          });
        }
      });

      return Array.from(topicsMap.values());
    },
    enabled: !!courseId
  });
}
