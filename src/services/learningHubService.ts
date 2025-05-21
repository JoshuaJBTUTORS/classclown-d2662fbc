
import { supabase } from '@/integrations/supabase/client';
import { Course, CourseModule, CourseLesson, StudentProgress } from '@/types/course';

export const learningHubService = {
  // Course methods
  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Course[] || [];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Course | null;
  },

  async createCourse(course: Partial<Course> & { title: string }): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
  },

  // Module methods
  async getModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as CourseModule[] || [];
  },

  async createModule(module: Partial<CourseModule> & { course_id: string; title: string; position: number }): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([module])
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  },

  async updateModule(moduleId: string, updates: Partial<CourseModule>): Promise<CourseModule> {
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', moduleId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  },

  async deleteModule(moduleId: string): Promise<void> {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);
    
    if (error) throw error;
  },

  // Lesson methods
  async getLessonsByModuleId(moduleId: string): Promise<CourseLesson[]> {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as CourseLesson[] || [];
  },

  async getLessonById(lessonId: string): Promise<CourseLesson | null> {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as CourseLesson | null;
  },

  async createLesson(lesson: Partial<CourseLesson> & { 
    module_id: string; 
    title: string; 
    content_type: 'video' | 'pdf' | 'text' | 'quiz';
    position: number 
  }): Promise<CourseLesson> {
    const { data, error } = await supabase
      .from('course_lessons')
      .insert([lesson])
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseLesson;
  },

  async updateLesson(lessonId: string, updates: Partial<CourseLesson>): Promise<CourseLesson> {
    const { data, error } = await supabase
      .from('course_lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseLesson;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
  },

  // Student Progress methods
  async getStudentProgress(studentId: number, lessonId: string): Promise<StudentProgress | null> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as StudentProgress | null;
  },

  async getAllStudentProgress(studentId: number): Promise<StudentProgress[]> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) throw error;
    return data as StudentProgress[] || [];
  },

  async updateStudentProgress(progressData: Partial<StudentProgress> & { student_id: number; lesson_id: string }): Promise<StudentProgress> {
    // If a record exists, update it; otherwise, insert a new record
    const { student_id, lesson_id } = progressData;
    const existingProgress = await this.getStudentProgress(student_id, lesson_id);
    
    if (existingProgress) {
      const { data, error } = await supabase
        .from('student_progress')
        .update(progressData)
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as StudentProgress;
    } else {
      const { data, error } = await supabase
        .from('student_progress')
        .insert([progressData])
        .select()
        .single();
      
      if (error) throw error;
      return data as StudentProgress;
    }
  }
};
