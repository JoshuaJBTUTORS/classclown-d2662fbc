import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  type: 'lesson' | 'module';
  lessonId?: string;
  lessonTitle?: string;
  lessonDescription?: string | null;
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

    // Search for modules
    const { data: moduleData, error: moduleError } = await supabase
      .from('course_modules')
      .select(`
        id,
        title,
        description,
        courses!inner (
          id,
          title,
          subject,
          status
        )
      `)
      .ilike('title', `%${searchTerm}%`)
      .eq('courses.status', 'published')
      .limit(5);

    // Search for lessons
    const { data: lessonData, error: lessonError } = await supabase
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

    if (moduleError) {
      console.error('Module search error:', moduleError);
    }

    if (lessonError) {
      console.error('Lesson search error:', lessonError);
    }

    const results: SearchResult[] = [];

    // Add module results
    if (moduleData) {
      moduleData.forEach((module: any) => {
        const course = module.courses;
        results.push({
          type: 'module',
          moduleId: module.id,
          moduleTitle: module.title,
          courseId: course.id,
          courseTitle: course.title,
          courseSubject: course.subject,
        });
      });
    }

    // Add lesson results
    if (lessonData) {
      lessonData.forEach((lesson: any) => {
        const module = lesson.course_modules;
        const course = module.courses;
        results.push({
          type: 'lesson',
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonDescription: lesson.description,
          moduleId: module.id,
          moduleTitle: module.title,
          courseId: course.id,
          courseTitle: course.title,
          courseSubject: course.subject,
        });
      });
    }

    return results;
  },
};
