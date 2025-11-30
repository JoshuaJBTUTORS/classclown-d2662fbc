import { supabase } from "@/integrations/supabase/client";
import type { Course } from "@/types/course";
import type { CourseEnrollment } from "@/types/userCourses";

export const courseMatchingService = {
  /**
   * Find or create a course for the given parameters
   */
  async findOrCreateCourse(
    subject: string,
    yearGroupId: string,
    curriculum: string,
    userId: string
  ): Promise<CourseEnrollment> {
    // First, try to find existing course
    const { data: existingCourses, error: searchError } = await supabase
      .from('courses')
      .select('*')
      .eq('subject', subject)
      .eq('year_group_id', yearGroupId)
      .eq('curriculum', curriculum)
      .eq('status', 'published')
      .limit(1);

    if (searchError) {
      console.error('Error searching for course:', searchError);
      throw searchError;
    }

    // If course exists, enroll user
    if (existingCourses && existingCourses.length > 0) {
      const course = existingCourses[0];
      await this.enrollUserInCourse(userId, course.id, 'onboarding');
      
      return {
        courseId: course.id,
        wasCreated: false,
        course,
      };
    }

    // Course doesn't exist, create new one
    const { data: yearGroup } = await supabase
      .from('year_groups')
      .select('name')
      .eq('id', yearGroupId)
      .single();

    const courseTitle = this.generateCourseTitle(yearGroup?.name || '', subject, curriculum);

    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert({
        title: courseTitle,
        subject,
        year_group_id: yearGroupId,
        curriculum,
        status: 'published',
        is_ai_generated: true,
        generation_status: 'shell',
        description: `AI-generated ${courseTitle} course`,
        difficulty_level: this.mapYearGroupToDifficulty(yearGroup?.name || ''),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating course:', createError);
      throw createError;
    }

    // Create initial empty modules
    await this.createInitialModules(newCourse.id);

    // Enroll user in new course
    await this.enrollUserInCourse(userId, newCourse.id, 'onboarding');

    return {
      courseId: newCourse.id,
      wasCreated: true,
      course: newCourse,
    };
  },

  /**
   * Enroll user in a course
   */
  async enrollUserInCourse(
    userId: string,
    courseId: string,
    source: 'onboarding' | 'manual' | 'recommendation'
  ): Promise<void> {
    const { error } = await supabase
      .from('user_courses')
      .insert({
        user_id: userId,
        course_id: courseId,
        source,
        is_auto_generated: source === 'onboarding',
      })
      .select()
      .single();

    // Ignore unique constraint errors (user already enrolled)
    if (error && !error.message.includes('unique')) {
      console.error('Error enrolling user:', error);
      throw error;
    }
  },

  /**
   * Get user's enrolled courses
   */
  async getUserCourses(userId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('user_courses')
      .select(`
        course_id,
        progress_percentage,
        last_accessed_at,
        courses (*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching user courses:', error);
      throw error;
    }

    return data?.map((enrollment: any) => ({
      ...enrollment.courses,
      progress: enrollment.progress_percentage,
      last_accessed: enrollment.last_accessed_at,
    })) || [];
  },

  /**
   * Generate course title based on year group and subject
   */
  generateCourseTitle(yearGroup: string, subject: string, curriculum: string): string {
    // English curriculum
    if (curriculum === 'english') {
      if (yearGroup.includes('10') || yearGroup.includes('11')) {
        return `GCSE ${subject}`;
      }
      if (yearGroup.includes('12') || yearGroup.includes('13')) {
        return `A-Level ${subject}`;
      }
      if (yearGroup.match(/Year [789]/)) {
        return `${yearGroup} ${subject}`;
      }
    }

    // Scottish curriculum
    if (curriculum === 'scottish') {
      if (yearGroup.includes('S4')) {
        return `National 5 ${subject}`;
      }
      if (yearGroup.includes('S5')) {
        return `Higher ${subject}`;
      }
      if (yearGroup.includes('S6')) {
        return `Advanced Higher ${subject}`;
      }
    }

    // Default format
    return `${yearGroup} ${subject}`;
  },

  /**
   * Create initial empty modules for a new course
   */
  async createInitialModules(courseId: string): Promise<void> {
    const modules = [
      {
        title: 'Getting Started',
        description: 'Introduction to the course and key concepts',
        position: 1,
        course_id: courseId,
      },
      {
        title: 'Core Topics',
        description: 'Main learning content and practice',
        position: 2,
        course_id: courseId,
      },
      {
        title: 'Assessment & Review',
        description: 'Test your knowledge and track progress',
        position: 3,
        course_id: courseId,
      },
    ];

    const { error } = await supabase
      .from('course_modules')
      .insert(modules);

    if (error) {
      console.error('Error creating initial modules:', error);
      throw error;
    }
  },

  /**
   * Map year group to difficulty level
   */
  mapYearGroupToDifficulty(yearGroup: string): string {
    if (yearGroup.match(/Year [123456]|P[123456]/)) {
      return 'primary';
    }
    if (yearGroup.match(/Year [789]|S[123]/)) {
      return 'ks3';
    }
    if (yearGroup.match(/Year (10|11)|S4/)) {
      return 'gcse';
    }
    if (yearGroup.match(/Year (12|13)|S[56]/)) {
      return 'a-level';
    }
    return 'intermediate';
  },
};
