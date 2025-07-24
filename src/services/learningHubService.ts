
import { supabase } from '@/integrations/supabase/client';
import { Course, CourseModule, CourseLesson, StudentProgress } from '@/types/course';
import { CourseNote, CreateCourseNoteRequest, UpdateCourseNoteRequest } from '@/types/courseNotes';
import { paymentService } from './paymentService';

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
      status: course.status || 'draft',
      price: course.price || 899 // Default to £8.99
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

  // Module methods - Fixed ordering for lessons
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
    
    // Ensure lessons within each module are sorted by position - fix type issue
    const sortedData = data.map(module => ({
      ...module,
      lessons: (module.lessons || []).sort((a: any, b: any) => a.position - b.position) as CourseLesson[]
    }));
    
    console.log('📚 getCourseModules - returning sorted data:', sortedData);
    return sortedData as CourseModule[];
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
      duration_minutes: lesson.duration_minutes,
      is_preview: lesson.is_preview || false
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

  // Check if user has purchased a course
  checkCoursePurchase: async (courseId: string): Promise<boolean> => {
    return await paymentService.checkCoursePurchase(courseId);
  },

  // Updated Student Progress method - supports both traditional students and learning hub users
  getStudentProgress: async (userEmail?: string, courseId?: string): Promise<StudentProgress[]> => {
    try {
      const email = userEmail || await learningHubService.getCurrentUserEmail();
      console.log('Getting student progress for email:', email, 'courseId:', courseId);
      
      // Check if user is a traditional student first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let query = supabase.from('student_progress').select('*');

      if (student && !studentError) {
        // Traditional student - use student_id
        console.log('Found student record:', student);
        query = query.eq('student_id', student.id);
      } else {
        // Learning Hub user - use user_id from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === email) {
          console.log('Using user_id for Learning Hub user:', user.id);
          query = query.eq('user_id', user.id);
        } else {
          console.log('No student record or auth user found for email:', email);
          return [];
        }
      }

      // If courseId is provided, we need to filter by lessons in that course
      if (courseId) {
        // First get all lesson IDs for this course
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('id')
          .in('module_id', 
            await supabase
              .from('course_modules')
              .select('id')
              .eq('course_id', courseId)
              .then(result => result.data?.map(m => m.id) || [])
          );

        if (lessonsError) {
          console.error('Error fetching lessons for course:', lessonsError);
          return [];
        }

        const lessonIds = lessons?.map(l => l.id) || [];
        if (lessonIds.length > 0) {
          query = query.in('lesson_id', lessonIds);
        } else {
          return []; // No lessons in course
        }
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching student progress:', error);
        return [];
      }
      
      console.log('Retrieved student progress:', data);
      return data as StudentProgress[];
    } catch (error) {
      console.error('Error in getStudentProgress:', error);
      return [];
    }
  },

  // Updated manual toggle completion method - supports both user types
  toggleLessonCompletion: async (userEmail: string, lessonId: string): Promise<StudentProgress> => {
    try {
      console.log('toggleLessonCompletion called with:', { userEmail, lessonId });
      
      // Check if user is a traditional student first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      console.log('Student lookup result:', { student, studentError });

      let existingQuery = supabase.from('student_progress').select('*').eq('lesson_id', lessonId);
      let insertData: any = { lesson_id: lessonId };

      if (student && !studentError) {
        // Traditional student - use student_id
        console.log('Processing as traditional student');
        existingQuery = existingQuery.eq('student_id', student.id);
        insertData.student_id = student.id;
      } else {
        // Learning Hub user - use user_id from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === userEmail) {
          console.log('Processing as Learning Hub user:', user.id);
          existingQuery = existingQuery.eq('user_id', user.id);
          insertData.user_id = user.id;
        } else {
          throw new Error('User not found or not authenticated');
        }
      }

      // Check if progress already exists
      const { data: existing } = await existingQuery.maybeSingle();
      console.log('Existing progress check:', existing);

      if (existing) {
        // Toggle completion status
        const newStatus = existing.status === 'completed' ? 'not_started' : 'completed';
        const updateData = {
          status: newStatus,
          completion_percentage: newStatus === 'completed' ? 100 : 0,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        };

        console.log('Updating existing progress with:', updateData);

        const { data, error } = await supabase
          .from('student_progress')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating progress:', error);
          throw error;
        }
        
        console.log('Successfully updated progress:', data);
        return data as StudentProgress;
      } else {
        // Create new completed progress
        insertData = {
          ...insertData,
          status: 'completed',
          completion_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        };

        console.log('Creating new progress with:', insertData);

        const { data, error } = await supabase
          .from('student_progress')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error creating progress:', error);
          throw error;
        }

        console.log('Successfully created progress:', data);
        return data as StudentProgress;
      }
    } catch (error) {
      console.error('Error in toggleLessonCompletion:', error);
      throw error;
    }
  },

  getCourseProgress: async (courseId: string, userEmail?: string): Promise<number> => {
    try {
      const email = userEmail || await learningHubService.getCurrentUserEmail();
      
      // Check if user is a traditional student first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (student && !studentError) {
        // Traditional student - use the existing RPC function
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
      } else {
        // Learning Hub user - calculate progress manually
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== email) {
          console.log('No auth user found for course progress calculation');
          return 0;
        }

        // Get all lessons in the course
        const { data: courseModules } = await supabase
          .from('course_modules')
          .select('id')
          .eq('course_id', courseId);

        if (!courseModules || courseModules.length === 0) {
          return 0;
        }

        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('id')
          .in('module_id', courseModules.map(m => m.id));

        if (!lessons || lessons.length === 0) {
          return 0;
        }

        // Get completed lessons for this user
        const { data: completedProgress } = await supabase
          .from('student_progress')
          .select('id')
          .eq('user_id', user.id)
          .in('lesson_id', lessons.map(l => l.id))
          .eq('status', 'completed');

        const completedCount = completedProgress?.length || 0;
        const totalCount = lessons.length;
        
        return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      }
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
  },

  // Course Notes methods
  getCourseNotes: async (courseId: string, lessonId?: string): Promise<CourseNote[]> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated');
        return [];
      }

      let query = supabase
        .from('course_notes')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching course notes:', error);
        return [];
      }
      
      return data as CourseNote[];
    } catch (error) {
      console.error('Error in getCourseNotes:', error);
      return [];
    }
  },

  createCourseNote: async (noteData: CreateCourseNoteRequest): Promise<CourseNote> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('course_notes')
      .insert({
        ...noteData,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseNote;
  },

  updateCourseNote: async (noteId: string, noteData: UpdateCourseNoteRequest): Promise<CourseNote> => {
    const { data, error } = await supabase
      .from('course_notes')
      .update(noteData)
      .eq('id', noteId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseNote;
  },

  deleteCourseNote: async (noteId: string): Promise<void> => {
    const { error } = await supabase
      .from('course_notes')
      .delete()
      .eq('id', noteId);
    
    if (error) throw error;
  },

  // Reordering methods - Fixed to ensure proper cache invalidation
  reorderModules: async (courseId: string, moduleOrders: { id: string; position: number }[]): Promise<void> => {
    console.log('Reordering modules:', moduleOrders);
    
    // Update each module's position
    const updates = moduleOrders.map(({ id, position }) => 
      supabase
        .from('course_modules')
        .update({ position })
        .eq('id', id)
        .eq('course_id', courseId)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating module positions:', errors);
      throw new Error('Failed to reorder modules');
    }
  },

  reorderLessons: async (moduleId: string, lessonOrders: { id: string; position: number }[]): Promise<void> => {
    console.log('Reordering lessons:', lessonOrders);
    
    // Update each lesson's position
    const updates = lessonOrders.map(({ id, position }) => 
      supabase
        .from('course_lessons')
        .update({ position })
        .eq('id', id)
        .eq('module_id', moduleId)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating lesson positions:', errors);
      throw new Error('Failed to reorder lessons');
    }
  },

  // Module access control
  checkModuleAccess: async (moduleId: string): Promise<boolean> => {
    try {
      const userEmail = await learningHubService.getCurrentUserEmail();
      
      // Get current module details
      const { data: currentModule, error: moduleError } = await supabase
        .from('course_modules')
        .select('position, course_id')
        .eq('id', moduleId)
        .single();

      if (moduleError || !currentModule) {
        console.error('Error fetching module:', moduleError);
        return false;
      }

      // If this is the first module, allow access
      if (currentModule.position <= 1) {
        return true;
      }

      // Get previous module
      const { data: previousModule, error: prevModuleError } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', currentModule.course_id)
        .eq('position', currentModule.position - 1)
        .single();

      if (prevModuleError || !previousModule) {
        console.error('Error fetching previous module:', prevModuleError);
        return false;
      }

      // Check if previous module has assessments
      const { data: assessments, error: assessmentError } = await supabase
        .from('module_assessments')
        .select('id')
        .eq('module_id', previousModule.id);

      if (assessmentError) {
        console.error('Error fetching assessments:', assessmentError);
        return false;
      }

      // If no assessments required, allow access
      if (!assessments || assessments.length === 0) {
        return true;
      }

      // Check if assessment is completed
      return await learningHubService.isModuleAssessmentCompleted(previousModule.id);
    } catch (error) {
      console.error('Error checking module access:', error);
      return false;
    }
  },

  // Assessment progression methods
  canProgressToModule: async (moduleId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('can_progress_to_module', {
        current_module_id: moduleId,
        user_id_param: user.id
      });

      if (error) {
        console.error('Error checking module progression:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error checking module progression:', error);
      return false;
    }
  },

  getModuleAssessments: async (moduleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('module_assessments')
        .select(`
          *,
          ai_assessments!inner(id, title, description, status)
        `)
        .eq('module_id', moduleId);

      if (error) {
        console.error('Error fetching module assessments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching module assessments:', error);
      return [];
    }
  },

  markAssessmentCompleted: async (lessonId: string, score: number): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const userEmail = await learningHubService.getCurrentUserEmail();
      
      // Check if student_progress exists for traditional students
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      // Update or insert progress record
      const progressData = {
        lesson_id: lessonId,
        assessment_completed: true,
        assessment_score: score,
        assessment_completed_at: new Date().toISOString(),
        status: 'completed',
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        ...(studentData ? { student_id: studentData.id } : { user_id: user.id })
      };

      const { error } = await supabase
        .from('student_progress')
        .upsert(progressData, {
          onConflict: studentData ? 'lesson_id,student_id' : 'lesson_id,user_id'
        });

      if (error) {
        console.error('Error marking assessment completed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking assessment completed:', error);
      return false;
    }
  },

  isModuleAssessmentCompleted: async (moduleId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const userEmail = await learningHubService.getCurrentUserEmail();
      
      // Get student ID if exists
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      // First get lesson IDs for this module
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('module_id', moduleId);

      if (!lessons || lessons.length === 0) {
        return false;
      }

      const lessonIds = lessons.map(l => l.id);

      // Check if any lesson in this module has completed assessment
      const { data, error } = await supabase
        .from('student_progress')
        .select('assessment_completed')
        .in('lesson_id', lessonIds)
        .eq(studentData ? 'student_id' : 'user_id', studentData?.id || user.id)
        .eq('assessment_completed', true)
        .limit(1);

      if (error) {
        console.error('Error checking module assessment completion:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking module assessment completion:', error);
      return false;
    }
  },
};
