
import { supabase } from '@/integrations/supabase/client';
import { Course, CourseModule, CourseLesson, StudentProgress } from '@/types/course';

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
    // Make sure the title is explicitly checked for
    if (!course.title) {
      throw new Error('Course title is required');
    }
    
    const courseToInsert = {
      title: course.title,
      description: course.description,
      cover_image_url: course.cover_image_url,
      subject: course.subject,
      difficulty_level: course.difficulty_level,
      status: course.status || 'draft'
    };
    
    const { data, error } = await supabase
      .from('courses')
      .insert(courseToInsert)
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
    // Make sure required fields are explicitly checked for
    if (!module.title || !module.course_id || module.position === undefined) {
      throw new Error('Module title, course_id and position are required');
    }
    
    const moduleToInsert = {
      title: module.title,
      description: module.description,
      course_id: module.course_id,
      position: module.position
    };
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert(moduleToInsert)
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
    // Make sure required fields are explicitly checked for
    if (!lesson.title || !lesson.module_id || !lesson.content_type || lesson.position === undefined) {
      throw new Error('Lesson title, module_id, content_type, and position are required');
    }
    
    const lessonToInsert = {
      title: lesson.title,
      description: lesson.description,
      module_id: lesson.module_id,
      content_type: lesson.content_type,
      content_url: lesson.content_url,
      content_text: lesson.content_text,
      position: lesson.position,
      duration_minutes: lesson.duration_minutes
    };
    
    const { data, error } = await supabase
      .from('course_lessons')
      .insert(lessonToInsert)
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

  // Helper function to get current user's email
  getCurrentUserEmail: async (): Promise<string> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      throw new Error('User not authenticated or email not available');
    }
    return user.email;
  },

  // Student Progress methods - Updated to use email-based student lookup
  getStudentProgress: async (userEmail?: string, courseId?: string): Promise<StudentProgress[]> => {
    try {
      // Get email from parameter or current user
      const email = userEmail || await learningHubService.getCurrentUserEmail();
      
      // First, get the student record for this email
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student record:', studentError);
        return [];
      }

      if (!student) {
        console.log('No student record found for email:', email);
        return [];
      }

      let query = supabase
        .from('student_progress')
        .select(`
          *,
          lesson:course_lessons(
            *,
            module:course_modules(*)
          )
        `)
        .eq('student_id', student.id);

      if (courseId) {
        query = query.eq('lesson.module.course_id', courseId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching student progress:', error);
        return [];
      }
      
      return data as StudentProgress[];
    } catch (error) {
      console.error('Error in getStudentProgress:', error);
      return [];
    }
  },

  // Simplified progress tracking - mark as complete immediately when accessed
  markLessonComplete: async (userEmail: string, lessonId: string): Promise<StudentProgress> => {
    try {
      // First, get the student record for this email
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student record:', studentError);
        throw new Error('Error finding student record');
      }

      if (!student) {
        console.error('No student record found for email:', userEmail);
        throw new Error('Student record not found. Please contact support.');
      }

      console.log('Found student record:', student.id, 'for email:', userEmail);

      // First, check if progress already exists
      const { data: existing } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', student.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        // Update existing progress to completed
        const { data, error } = await supabase
          .from('student_progress')
          .update({
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating progress:', error);
          throw error;
        }
        
        console.log('Updated existing progress record');
        return data as StudentProgress;
      } else {
        // Create new progress as completed
        const { data, error } = await supabase
          .from('student_progress')
          .insert({
            student_id: student.id,
            lesson_id: lessonId,
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating progress:', error);
          throw error;
        }
        
        console.log('Created new progress record');
        return data as StudentProgress;
      }
    } catch (error) {
      console.error('Error in markLessonComplete:', error);
      throw error;
    }
  },

  getCourseProgress: async (courseId: string, userEmail?: string): Promise<number> => {
    try {
      // Get email from parameter or current user
      const email = userEmail || await learningHubService.getCurrentUserEmail();
      
      // First, get the student record for this email
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (studentError || !student) {
        console.log('No student record found for course progress calculation');
        return 0;
      }

      const { data, error } = await supabase
        .rpc('calculate_course_completion', {
          course_id_param: courseId,
          student_id_param: student.id
        });

      if (error) {
        console.error('Error calculating course progress:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.error('Error in getCourseProgress:', error);
      return 0;
    }
  },

  getNextLesson: async (currentLessonId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .rpc('get_next_lesson', {
        current_lesson_id: currentLessonId
      });

    if (error) throw error;
    return data;
  }
};
