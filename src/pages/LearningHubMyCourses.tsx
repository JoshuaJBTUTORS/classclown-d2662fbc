import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

// Course emoji mapping for 11+ subjects
const courseEmojiMap: Record<string, string> = {
  '11 Plus Maths': '🧮',
  '11 Plus English': '📘',
  '11 Plus VR': '🧬',
  '11 Plus NVR': '⚡',
};

const getCourseEmoji = (title: string): string => {
  return courseEmojiMap[title] || '📚';
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
  const { data: allCourses } = useQuery({
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

  // Get purchased course details
  const purchasedCoursesWithDetails = purchasedCourses?.map(purchase => {
    const course = allCourses?.find(c => c.id === purchase.course_id);
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
  const myCourses = [...freeCoursesWithDetails, ...purchasedCoursesWithDetails];

  // Loading state
  if (coursesLoading || freeCoursesLoading) {
    return (
      <div className="p-10" style={{ background: 'hsl(var(--cleo-bg-light))' }}>
        <div className="strategist-banner">
          ⚡ Strategist Mode: <span>ON</span>
        </div>
        <div className="courses-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="course-card animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded-full mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (myCourses.length === 0) {
    return (
      <div className="p-10" style={{ background: 'hsl(var(--cleo-bg-light))' }}>
        <div className="strategist-banner">
          ⚡ Strategist Mode: <span>ON</span>
        </div>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
            No courses yet
          </h3>
          <p className="text-gray-600">Start your 11+ journey today!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10" style={{ background: 'hsl(var(--cleo-bg-light))' }}>
      {/* Strategist Mode Banner */}
      <div className="strategist-banner">
        ⚡ Strategist Mode: <span>ON</span>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {myCourses.map((course) => (
          <div
            key={course.id}
            className="course-card"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            <div className="course-icon">
              {getCourseEmoji(course.title)}
            </div>
            <div className="course-title">{course.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningHubMyCourses;
