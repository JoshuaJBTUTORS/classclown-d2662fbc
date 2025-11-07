
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import CourseCard from '@/components/learningHub/CourseCard';
import SubscriptionManager from '@/components/learningHub/SubscriptionManager';
import LiveTutoringUpgradeModal from '@/components/learningHub/LiveTutoringUpgradeModal';
import { EnrolledCoursesSection } from '@/components/learningHub/EnrolledCoursesSection';
import { BookOpen, Brain, Calendar, TrendingUp, Video, Sparkles, Bot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LearningHubDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Mock user progress data since the service method doesn't exist yet
  const userProgress = {
    completedCourses: 0,
    thisWeekHours: 0,
    assessmentsCompleted: 0
  };

  const featuredCourses = courses?.filter(course => course.status === 'published').slice(0, 3) || [];

  const handleAccessLiveTutoring = () => {
    // If user is parent or student, navigate to CRM
    if (userRole === 'parent' || userRole === 'student' || userRole === 'admin' || userRole === 'owner' || userRole === 'tutor') {
      navigate('/calendar');
    } else {
      // Otherwise show upgrade modal
      setShowUpgradeModal(true);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8" style={{ background: '#eceff1', minHeight: '100vh' }}>
      {/* Welcome Hero - Cleo Style */}
      <div className="cleo-screen text-center">
        <div className="cleo-avatar-circle mx-auto mb-4" style={{ fontSize: '46px' }}>
          {user?.user_metadata?.avatar || '😊'}
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
          Welcome back, {user?.user_metadata?.first_name || 'Learner'} 🦊
        </h2>
        <p className="text-gray-600 mb-6">
          Let's pick up where your focus left off 💚
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button
            onClick={handleAccessLiveTutoring}
            className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-50 border-2 border-gray-200 shadow-lg rounded-full font-semibold"
          >
            🎥 Access Live Tutoring
          </Button>
          <Button
            asChild
            className="cleo-btn-outline w-full"
          >
            <Link to="/learning-hub/my-courses">
              🧠 Continue Learning
            </Link>
          </Button>
        </div>
        
        <p className="mt-6 text-sm text-gray-600">
          <strong>Cleo says:</strong> Your focus is your greatest strategy. 💚
        </p>
      </div>

      {/* Quick Stats - Cleo Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cleo-card-white text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--cleo-green))' }}>
            {courses?.filter(c => c.status === 'published').length || 0}
          </div>
          <div className="text-sm text-gray-600">Available Courses</div>
        </div>
        
        <div className="cleo-card-white text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--cleo-green))' }}>
            {userProgress?.completedCourses || 0}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="cleo-card-white text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--cleo-green))' }}>
            {userProgress?.thisWeekHours || 0}h
          </div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        
        <div className="cleo-card-white text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--cleo-green))' }}>
            87%
          </div>
          <div className="text-sm text-gray-600">Focus Score</div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <EnrolledCoursesSection />

      {/* Subscription Management */}
      <SubscriptionManager />

      {/* Featured Courses */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Button asChild variant="outline">
            <Link to="/learning-hub/courses">
              Browse All Courses
            </Link>
          </Button>
        </div>
        
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses available yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upgrade Modal */}
      <LiveTutoringUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default LearningHubDashboard;
