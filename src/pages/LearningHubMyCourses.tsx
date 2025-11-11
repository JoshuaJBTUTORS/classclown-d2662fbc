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

// Helper to extract core subject name from a subject string
const extractCoreSubject = (subjectName: string): string => {
  // Remove prefixes like "GCSE", "11 Plus", "A-Level"
  return subjectName
    .replace(/^GCSE\s+/i, '')
    .replace(/^11 Plus\s+/i, '')
    .replace(/^A-Level\s+/i, '')
    .trim()
    .toLowerCase();
};

// Check if a course matches the selected subjects
const courseMatchesSelectedSubjects = (course: any, selectedSubjectNames: string[]): boolean => {
  if (!selectedSubjectNames || selectedSubjectNames.length === 0) {
    return true; // No filter applied if no subjects selected
  }
  
  const courseSubject = course.subject || '';
  const courseTitle = course.title || '';
  const coreSubjects = selectedSubjectNames.map(extractCoreSubject);
  
  // Check if course subject or title contains any of the selected core subjects
  return coreSubjects.some(coreSubject => {
    return courseSubject.toLowerCase().includes(coreSubject) ||
           courseTitle.toLowerCase().includes(coreSubject);
  });
};

const LearningHubMyCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check platform subscription access
  const { data: subscriptionAccess, isLoading: coursesLoading } = useQuery({
    queryKey: ['platform-subscription-access', user?.id],
    queryFn: paymentService.checkPlatformSubscriptionAccess,
    enabled: !!user,
  });

  // Fetch all courses for details
  const { data: allCoursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Fetch published courses (all courses if user has subscription)
  const { data: availableCourses, isLoading: freeCoursesLoading } = useQuery({
    queryKey: ['available-courses', subscriptionAccess?.hasAccess],
    queryFn: async () => {
      if (!subscriptionAccess?.hasAccess) return [];
      const courses = await learningHubService.getCourses();
      return courses?.filter((c: any) => c.status === 'published') || [];
    },
    enabled: !!user && subscriptionAccess !== undefined,
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

  // Fetch user profile preferences
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('education_level, gcse_subject_ids')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch selected subject names if GCSE subjects are selected
  const { data: selectedSubjects } = useQuery({
    queryKey: ['selected-subjects', userProfile?.gcse_subject_ids],
    queryFn: async () => {
      if (!userProfile?.gcse_subject_ids || userProfile.gcse_subject_ids.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', userProfile.gcse_subject_ids);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.gcse_subject_ids && userProfile.gcse_subject_ids.length > 0,
  });

  // Determine courses to show based on subscription
  const allCourses = !subscriptionAccess?.hasAccess 
    ? [] 
    : (availableCourses || []);

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

  // Apply user preference filtering
  const filteredCourses = myCourses.filter(course => {
    // If no education level selected, show all courses
    if (!userProfile?.education_level) {
      return true;
    }
    
    // Filter by education level
    if (userProfile.education_level === '11_plus') {
      // Show only 11 Plus courses
      return is11PlusCourse(course);
    }
    
    if (userProfile.education_level === 'gcse') {
      // Show only GCSE courses that match selected subjects
      const isGCSE = isGCSECourse(course);
      if (!isGCSE) return false;
      
      // If no subjects selected yet, show all GCSE courses
      if (!selectedSubjects || selectedSubjects.length === 0) {
        return true;
      }
      
      // Filter by selected subjects
      const subjectNames = selectedSubjects.map(s => s.name);
      return courseMatchesSelectedSubjects(course, subjectNames);
    }
    
    return true;
  });

  // Separate filtered courses into categories for display
  const elevenPlusCourses = filteredCourses.filter(is11PlusCourse);
  const gcseCourses = filteredCourses.filter(isGCSECourse);

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

  // Empty state - no subscription
  if (!subscriptionAccess?.hasAccess) {
    return (
      <div className="cleo-screen-wrapper">
        <section className="cleo-screen-courses">
          <div className="strategist-header">
            <div className="fox-avatar">🦊</div>
            <div className="strategist-info">
              <h2>Strategist Mode: ON</h2>
              <p className="small-label">
                Cleo says: "Let's unlock your learning journey!"
              </p>
            </div>
          </div>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
              Subscription Required
            </h3>
            <p className="text-gray-600 mb-4">
              Subscribe to unlock all courses and voice sessions with Cleo
            </p>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            >
              View Subscription Plans
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Empty state - has subscription but filtered courses are empty
  if (filteredCourses.length === 0) {
    const emptyMessage = userProfile?.education_level === '11_plus' 
      ? 'No 11 Plus courses found'
      : userProfile?.education_level === 'gcse'
      ? 'No GCSE courses found for your selected subjects'
      : 'No courses yet';
    
    const emptyDescription = userProfile?.education_level
      ? 'Update your settings to see more courses.'
      : 'Start your learning journey today!';
    
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
              {emptyMessage}
            </h3>
            <p className="text-gray-600 mb-4">{emptyDescription}</p>
            {userProfile?.education_level && (
              <button 
                onClick={() => navigate('/learning-hub/settings')}
                className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              >
                Go to Settings
              </button>
            )}
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
