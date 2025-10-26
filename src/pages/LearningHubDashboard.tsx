
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import CourseCard from '@/components/learningHub/CourseCard';
import SubscriptionManager from '@/components/learningHub/SubscriptionManager';
import LiveTutoringUpgradeModal from '@/components/learningHub/LiveTutoringUpgradeModal';
import { BookOpen, Brain, Calendar, TrendingUp, Video, Sparkles } from 'lucide-react';
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
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Hero Section with Live Tutoring CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-200 p-8 md:p-12 text-gray-800 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Welcome to Your Learning Hub, {user?.user_metadata?.first_name || 'Learner'}! 🎓
          </h1>
          <p className="text-lg md:text-xl mb-8 text-purple-800">
            Explore self-paced courses, track your progress, and unlock your potential
          </p>
          
          <Button
            onClick={handleAccessLiveTutoring}
            size="lg"
            className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-purple-700 text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 font-bold"
          >
            <Video className="h-5 w-5 mr-2" />
            Access Live Tutoring
            <Sparkles className="h-5 w-5 ml-2" />
          </Button>
          
          {userRole === 'learning_hub_only' && (
            <p className="mt-4 text-sm text-purple-800">
              🌟 Upgrade to unlock 1-on-1 tutoring from £9.99/month
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Courses</p>
                <p className="text-2xl font-bold">{courses?.filter(c => c.status === 'published').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{userProgress?.completedCourses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{userProgress?.thisWeekHours || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assessments</p>
                <p className="text-2xl font-bold">{userProgress?.assessmentsCompleted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <SubscriptionManager />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Courses
            </CardTitle>
            <CardDescription>
              Continue learning with your enrolled courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/learning-hub/my-courses">
                View My Courses
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Browse Courses
            </CardTitle>
            <CardDescription>
              Explore our complete course catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/learning-hub/courses">
                Browse All
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Personal Growth
            </CardTitle>
            <CardDescription>
              Take assessments and track your knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/learning-hub/assessments">
                Start Assessment
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Revision Calendar
            </CardTitle>
            <CardDescription>
              Plan and schedule your study sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/learning-hub/revision">
                Plan Study Time
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Courses */}
      <div>
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
