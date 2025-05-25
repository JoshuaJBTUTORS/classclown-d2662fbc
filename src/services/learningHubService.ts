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

  // Student Progress methods - Updated to handle UUID to integer mapping
  getStudentProgress: async (userId: string, courseId?: string): Promise<StudentProgress[]> => {
    // First, get the student record by matching with auth user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', userId)
      .maybeSingle();

    if (studentError) {
      console.error('Error finding student:', studentError);
      throw studentError;
    }

    if (!studentData) {
      console.log('No student record found for user:', userId);
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
      .eq('student_id', studentData.id);

    if (courseId) {
      // We need to join through the lessons to filter by course
      const { data, error } = await supabase
        .from('student_progress')
        .select(`
          *,
          lesson:course_lessons!inner(
            *,
            module:course_modules!inner(*)
          )
        `)
        .eq('student_id', studentData.id)
        .eq('lesson.module.course_id', courseId);

      if (error) throw error;
      return data as StudentProgress[];
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as StudentProgress[];
  },

  createOrUpdateProgress: async (progress: Partial<StudentProgress>): Promise<StudentProgress> => {
    console.log('Creating/updating progress:', progress);
    
    // First, get the student record by matching with auth user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', progress.student_id!)
      .maybeSingle();

    if (studentError) {
      console.error('Error finding student:', studentError);
      throw studentError;
    }

    if (!studentData) {
      console.error('No student record found for user:', progress.student_id);
      throw new Error('Student record not found. Please ensure the user is registered as a student.');
    }

    const studentId = studentData.id;

    // Check if progress already exists
    const { data: existing } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', progress.lesson_id!)
      .single();

    if (existing) {
      // Update existing progress
      const { data, error } = await supabase
        .from('student_progress')
        .update({
          status: progress.status,
          completion_percentage: progress.completion_percentage,
          completed_at: progress.status === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw error;
      }
      return data as StudentProgress;
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('student_progress')
        .insert({
          student_id: studentId,
          lesson_id: progress.lesson_id,
          status: progress.status || 'in_progress',
          completion_percentage: progress.completion_percentage || 0,
          completed_at: progress.status === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        throw error;
      }
      return data as StudentProgress;
    }
  },

  getCourseProgress: async (courseId: string, studentId: string): Promise<number> => {
    // First, get the student record by matching with auth user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (studentError) {
      console.error('Error finding student:', studentError);
      throw studentError;
    }

    if (!studentData) {
      console.log('No student record found for user:', studentId);
      return 0;
    }

    const { data, error } = await supabase
      .rpc('calculate_course_completion', {
        course_id_param: courseId,
        student_id_param: studentData.id.toString()
      });

    if (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
    return data || 0;
  },

  getNextLesson: async (currentLessonId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .rpc('get_next_lesson', {
        current_lesson_id: currentLessonId
      });

    if (error) {
      console.error('Error getting next lesson:', error);
      throw error;
    }
    return data;
  }
};
