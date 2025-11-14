import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string | null;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  courseSubject: string | null;
}

export const lessonSearchService = {
  async searchLessons(searchTerm: string): Promise<SearchResult[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('course_lessons')
      .select(`
        id,
        title,
        description,
        module_id,
        course_modules!inner (
          id,
          title,
          position,
          courses!inner (
            id,
            title,
            subject,
            status
          )
        )
      `)
      .ilike('title', `%${searchTerm}%`)
      .eq('course_modules.courses.status', 'published')
      .order('position', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    if (!data) return [];

    // Transform the data into our SearchResult format
    const results: SearchResult[] = data.map((lesson: any) => {
      const module = lesson.course_modules;
      const course = module.courses;
      
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        moduleId: module.id,
        moduleTitle: module.title,
        courseId: course.id,
        courseTitle: course.title,
        courseSubject: course.subject,
      };
    });

    return results;
  },
};
