
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Play,
  ChevronRight,
  Brain,
  Award,
  Target
} from 'lucide-react';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { Course, StudentProgress } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';

const LearningHubDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [recentActivity, setRecentActivity] = useState<StudentProgress[]>([]);

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

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: () => learningHubService.getStudentProgress(),
    enabled: !!user,
  });

  // Get purchased course details
  const myCourses = purchasedCourses?.map(purchase => {
    const course = allCourses?.find(c => c.id === purchase.course_id);
    return course ? { ...course, purchaseDate: purchase.purchase_date } : null;
  }).filter(Boolean) || [];

  // Get recent activity (last 5 progress entries)
  useEffect(() => {
    if (userProgress) {
      const recent = userProgress
        .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
        .slice(0, 5);
      setRecentActivity(recent);
    }
  }, [userProgress]);

  const stats = {
    totalCourses: myCourses.length,
    completedLessons: userProgress?.filter(p => p.status === 'completed').length || 0,
    inProgressCourses: myCourses.filter(course => {
      const courseProgress = userProgress?.filter(p => p.lesson_id) || [];
      return courseProgress.length > 0;
    }).length,
    totalStudyTime: Math.floor(Math.random() * 50) + 10 // Placeholder - could be calculated from actual data
  };

  const assessmentFilters = {
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  };

  if (coursesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back to your learning journey!</p>
        </div>
        <Button onClick={() => navigate('/learning-hub/library')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Browse Courses
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">My Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">My Courses</CardTitle>
                <CardDescription>Continue your learning journey</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/learning-hub/my-courses')}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-4">Browse our course library to get started</p>
                <Button onClick={() => navigate('/learning-hub/library')}>
                  Browse Courses
                </Button>
              </div>
            ) : (
              myCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{course.subject}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.floor(Math.random() * 100)} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}%</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/learning-hub/course/${course.id}`)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Continue
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Continue Where You Left Off */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Continue Where You Left Off</CardTitle>
            <CardDescription>Pick up where you stopped</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">Start a course to see your progress here</p>
              </div>
            ) : (
              recentActivity.map((progress) => (
                <div key={progress.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">Lesson Progress</p>
                    <p className="text-sm text-gray-600">
                      Last accessed: {new Date(progress.last_accessed_at).toLocaleDateString()}
                    </p>
                    <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {progress.status}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    Continue
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment Progress */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Assessment Progress
                </CardTitle>
                <CardDescription>Track your assessment performance over time</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/learning-hub/assessments')}>
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AssessmentProgressChart filters={assessmentFilters} userRole={userRole || 'student'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningHubDashboard;
