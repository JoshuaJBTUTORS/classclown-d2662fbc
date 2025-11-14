
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import CourseCard from '@/components/learningHub/CourseCard';
import SubscriptionManager from '@/components/learningHub/SubscriptionManager';
import LiveTutoringUpgradeModal from '@/components/learningHub/LiveTutoringUpgradeModal';
import { EnrolledCoursesSection } from '@/components/learningHub/EnrolledCoursesSection';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { BookOpen, Brain, Calendar, TrendingUp, Video, Sparkles, Bot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LearningHubDashboard = () => {
  const { user, profile, primaryStudentName, userRole } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const displayName = (userRole === 'parent' && primaryStudentName) 
    ? primaryStudentName 
    : (profile?.first_name || user?.user_metadata?.first_name || 'Learner');

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
    <div className="w-full min-h-screen flex flex-col" style={{ background: '#fafaf9' }}>
      {/* Top Bar with Voice Minutes Indicator */}
      <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24 py-4 flex justify-end">
        <VoiceSessionIndicator />
      </div>

      {/* Welcome Hero - Cleo Style */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center w-full px-4 sm:px-8 md:px-16 lg:px-24 py-12">
        <div className="cleo-avatar-circle mx-auto mb-4" style={{ fontSize: '46px' }}>
          {user?.user_metadata?.avatar || '😊'}
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
          Welcome back, {displayName} 🦊
        </h2>
        <p className="text-sm text-gray-600 mb-4">Strategist Mode: Engaged.</p>
        <p className="text-gray-600 mb-8">
          Let's pick up where your focus left off 💚
        </p>
        
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Button
            asChild
            className="w-full flex items-center justify-center gap-2 text-lg py-6 font-bold"
            style={{
              background: 'linear-gradient(135deg, #1fb86b, #35d086)',
              color: '#fff',
              borderRadius: '999px',
              boxShadow: '0 12px 26px rgba(22, 160, 90, 0.35)'
            }}
          >
            <Link to="/learning-hub/my-courses" className="flex items-center justify-center gap-2">
              🔥 Learn with Cleo
            </Link>
          </Button>
          <Button
            onClick={handleAccessLiveTutoring}
            className="w-full flex items-center justify-center gap-2 text-lg py-6 font-bold"
            style={{
              border: '2px solid rgba(37, 184, 107, 0.5)',
              background: 'rgba(255, 255, 255, 0.8)',
              color: 'var(--cleo-text-dark)',
              borderRadius: '999px'
            }}
          >
            🎓 Access Live Tutoring
          </Button>
        </div>
        
        <p className="mt-8 text-sm text-gray-600">
          <strong>Cleo says:</strong> Your focus is your greatest strategy. 💚
        </p>
        </div>
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
