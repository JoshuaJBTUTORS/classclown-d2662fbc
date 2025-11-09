import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Course emoji mapping for both 11+ and GCSE subjects
const courseEmojiMap: Record<string, string> = {
  // 11 Plus subjects
  '11 Plus Maths': '🔢',
  '11 Plus English': '✏️',
  '11 Plus VR': '🧬',
  '11 Plus NVR': '⚛️',
  
  // GCSE subjects
  'GCSE Maths': '📐',
  'GCSE English': '📝',
  'GCSE English Language': '📖',
  'GCSE English Literature': '📚',
  'GCSE Biology': '🧬',
  'GCSE Chemistry': '⚗️',
  'GCSE Physics': '⚛️',
  'GCSE Computer Science': '💻',
};

const getCourseEmoji = (title: string): string => {
  return courseEmojiMap[title] || '📚';
};

// Helper functions for streak calculation
const getDaysSinceLastAccess = (lastAccessedAt: string | null): number => {
  if (!lastAccessedAt) return 999;
  const lastAccess = new Date(lastAccessedAt);
  const today = new Date();
  const diffTime = today.getTime() - lastAccess.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const hasStreak = (lastAccessedAt: string | null): boolean => {
  const days = getDaysSinceLastAccess(lastAccessedAt);
  return days <= 1; // Accessed today or yesterday
};

const getStreakText = (lastAccessedAt: string | null): string => {
  const days = getDaysSinceLastAccess(lastAccessedAt);
  
  if (days === 0) return '1-day streak';
  if (days === 1) return '2-day streak';
  if (days <= 7) return `${Math.max(1, 7 - days)}-day streak`;
  
  return 'Start your streak!';
};

const LearningHubMyCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch purchased courses
  const { data: purchasedCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['purchased-courses'],
    queryFn: paymentService.getUserPurchases,
    enabled: !!user,
  });

  // Fetch all courses for details
  const { data: allCoursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Fetch free courses
  const { data: freeCourses, isLoading: freeCoursesLoading } = useQuery({
    queryKey: ['free-courses'],
    queryFn: async () => {
      const courses = await learningHubService.getCourses();
      return courses?.filter((c: any) => c.is_free_for_all && c.status === 'published') || [];
    },
    enabled: !!user,
  });

  // Fetch user_courses to get progress data
  const { data: userCoursesData } = useQuery({
    queryKey: ['user-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_courses')
        .select('course_id, progress_percentage, last_accessed_at')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get purchased course details
  const purchasedCoursesWithDetails = purchasedCourses?.map(purchase => {
    const course = allCoursesData?.find(c => c.id === purchase.course_id);
    if (!course) return null;
    return { ...course, isFree: false };
  }).filter(Boolean) || [];

  // Get free courses
  const freeCoursesWithDetails = freeCourses?.map(course => ({
    ...course,
    isFree: true
  })) || [];

  // Combine purchased and free courses (remove duplicates)
  const purchasedCourseIds = new Set(purchasedCoursesWithDetails.map(c => c.id));
  const uniqueFreeCourses = freeCoursesWithDetails.filter(c => !purchasedCourseIds.has(c.id));
  const allCourses = [...freeCoursesWithDetails, ...purchasedCoursesWithDetails];

  // Merge progress data with course details
  const myCourses = allCourses.map(course => {
    const userCourse = userCoursesData?.find(uc => uc.course_id === course.id);
    return {
      ...course,
      progress: userCourse?.progress_percentage || 0,
      last_accessed: userCourse?.last_accessed_at || null,
    };
  });

  // Filter courses by category
  const is11PlusCourse = (course: any) => {
    return course.title?.includes('11 Plus') || course.subject?.includes('11 Plus');
  };

  const isGCSECourse = (course: any) => {
    return course.title?.includes('GCSE') || course.subject?.includes('GCSE');
  };

  // Separate courses into categories
  const elevenPlusCourses = myCourses.filter(is11PlusCourse);
  const gcseCourses = myCourses.filter(isGCSECourse);

  // Loading state
  if (coursesLoading || freeCoursesLoading) {
    return (
      <div className="cleo-screen-wrapper">
        <section className="cleo-screen-courses">
          <div className="strategist-header">
            <div className="fox-avatar">🦊</div>
            <div className="strategist-info">
              <h2>Strategist Mode: ON</h2>
              <p className="small-label">
                Cleo says: "Choose your next challenge. Let's play smart."
              </p>
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="course-pill animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="progress-bar-thin">
                <div className="h-full w-1/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Empty state
  if (myCourses.length === 0) {
    return (
      <div className="cleo-screen-wrapper">
        <section className="cleo-screen-courses">
          <div className="strategist-header">
            <div className="fox-avatar">🦊</div>
            <div className="strategist-info">
              <h2>Strategist Mode: ON</h2>
              <p className="small-label">
                Cleo says: "Choose your next challenge. Let's play smart."
              </p>
            </div>
          </div>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
              No courses yet
            </h3>
            <p className="text-gray-600">Start your 11+ journey today!</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="cleo-screen-wrapper">
      <section className="cleo-screen-courses">
        {/* Header with fox emoji */}
        <div className="strategist-header">
          <div className="fox-avatar">🦊</div>
          <div className="strategist-info">
            <h2>Strategist Mode: ON</h2>
            <p className="small-label">
              Cleo says: "Choose your next challenge. Let's play smart."
            </p>
          </div>
        </div>

        {/* Tabs for course categories */}
        <Tabs defaultValue="11plus" className="cleo-tabs">
          <TabsList className="cleo-tabs-list">
            <TabsTrigger value="11plus" className="cleo-tabs-trigger">
              11 Plus
            </TabsTrigger>
            <TabsTrigger value="gcse" className="cleo-tabs-trigger">
              GCSE
            </TabsTrigger>
          </TabsList>

          {/* 11 Plus courses */}
          <TabsContent value="11plus" className="cleo-tabs-content">
            {elevenPlusCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No 11 Plus courses yet</p>
              </div>
            ) : (
              elevenPlusCourses.map((course) => (
                <div
                  key={course.id}
                  className="course-pill"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="course-pill-title">
                    {getCourseEmoji(course.title)} {course.title}
                  </div>
                  <div className="course-pill-meta">
                    <span>{getStreakText(course.last_accessed)}</span>
                    <span>{course.progress || 0}%</span>
                  </div>
                  <div className="progress-bar-thin">
                    <div
                      className="progress-bar-thin-fill"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                  {hasStreak(course.last_accessed) && (
                    <div className="flame-soft-right" />
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* GCSE courses */}
          <TabsContent value="gcse" className="cleo-tabs-content">
            {gcseCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No GCSE courses yet</p>
              </div>
            ) : (
              gcseCourses.map((course) => (
                <div
                  key={course.id}
                  className="course-pill"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="course-pill-title">
                    {getCourseEmoji(course.title)} {course.title}
                  </div>
                  <div className="course-pill-meta">
                    <span>{getStreakText(course.last_accessed)}</span>
                    <span>{course.progress || 0}%</span>
                  </div>
                  <div className="progress-bar-thin">
                    <div
                      className="progress-bar-thin-fill"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                  {hasStreak(course.last_accessed) && (
                    <div className="flame-soft-right" />
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer tip */}
        <p className="footer-note">
          💡 Tip from Cleo: Strategy beats speed — small steps, daily.
        </p>
      </section>
    </div>
  );
};

export default LearningHubMyCourses;
