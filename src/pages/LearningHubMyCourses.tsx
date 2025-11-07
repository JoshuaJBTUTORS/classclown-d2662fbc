import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Course emoji mapping for 11+ subjects - updated to match design
const courseEmojiMap: Record<string, string> = {
  '11 Plus Maths': '🔢',
  '11 Plus English': '✏️',
  '11 Plus VR': '🧬',
  '11 Plus NVR': '⚛️',
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

        {/* Course pills list */}
        {myCourses.map((course) => (
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
            {/* Show flame only if there's a streak */}
            {hasStreak(course.last_accessed) && (
              <div className="flame-soft-right" />
            )}
          </div>
        ))}

        {/* Footer tip */}
        <p className="footer-note">
          💡 Tip from Cleo: Strategy beats speed — small steps, daily.
        </p>
      </section>
    </div>
  );
};

export default LearningHubMyCourses;
