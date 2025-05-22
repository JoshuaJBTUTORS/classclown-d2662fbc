
import { supabase } from '@/integrations/supabase/client';
import { Course, CourseModule, CourseLesson, QuizQuestion, QuizOption } from '@/types/course';

export const learningHubService = {
  // Course methods
  getCourses: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Course[];
  },

  getCourseById: async (id: string): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  createCourse: async (course: Partial<Course>): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  updateCourse: async (id: string, course: Partial<Course>): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .update(course)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  deleteCourse: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Module methods
  getCourseModules: async (courseId: string): Promise<CourseModule[]> => {
    const { data, error } = await supabase
      .from('course_modules')
      .select(`
        *,
        lessons:course_lessons(*)
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as CourseModule[];
  },

  createModule: async (module: Partial<CourseModule>): Promise<CourseModule> => {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([module])
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  },

  updateModule: async (id: string, module: Partial<CourseModule>): Promise<CourseModule> => {
    const { data, error } = await supabase
      .from('course_modules')
      .update(module)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  },

  deleteModule: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Lesson methods
  createLesson: async (lesson: Partial<CourseLesson>): Promise<CourseLesson> => {
    const { data, error } = await supabase
      .from('course_lessons')
      .insert([lesson])
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseLesson;
  },

  updateLesson: async (id: string, lesson: Partial<CourseLesson>): Promise<CourseLesson> => {
    const { data, error } = await supabase
      .from('course_lessons')
      .update(lesson)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseLesson;
  },

  deleteLesson: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Quiz methods
  getQuizQuestions: async (lessonId: string): Promise<QuizQuestion[]> => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        options:quiz_options(*)
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as unknown as QuizQuestion[];
  },

  createQuizQuestion: async (question: Partial<QuizQuestion>): Promise<QuizQuestion> => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([question])
      .select()
      .single();
    
    if (error) throw error;
    return data as QuizQuestion;
  },

  updateQuizQuestion: async (id: string, question: Partial<QuizQuestion>): Promise<QuizQuestion> => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(question)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as QuizQuestion;
  },

  deleteQuizQuestion: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Quiz Options methods
  createQuizOption: async (option: Partial<QuizOption>): Promise<QuizOption> => {
    const { data, error } = await supabase
      .from('quiz_options')
      .insert([option])
      .select()
      .single();
    
    if (error) throw error;
    return data as QuizOption;
  },

  updateQuizOption: async (id: string, option: Partial<QuizOption>): Promise<QuizOption> => {
    const { data, error } = await supabase
      .from('quiz_options')
      .update(option)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as QuizOption;
  },

  deleteQuizOption: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('quiz_options')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
