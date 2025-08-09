
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import CourseCard from '@/components/learningHub/CourseCard';
import LearningHubSubscriptionManager from '@/components/learningHub/LearningHubSubscriptionManager';
import { BookOpen, Brain, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LearningHubDashboard = () => {
  const { user } = useAuth();

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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Learning Hub
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlimited access to all courses for just £25/month
        </p>
        <div className="mt-6 flex justify-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-3">
            <p className="text-primary font-semibold">🎉 7-day free trial available</p>
          </div>
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
                <p className="text-sm font-medium text-gray-600">Your Progress</p>
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
      <LearningHubSubscriptionManager />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Browse Courses
            </CardTitle>
            <CardDescription>
              Explore all available courses in our library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/learning-hub/library">
                View Course Library
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Practice & Assess
            </CardTitle>
            <CardDescription>
              Test your knowledge with interactive assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/learning-hub/assessments">
                Take Assessment
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Study Schedule
            </CardTitle>
            <CardDescription>
              Plan your learning journey with our tools
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
            <Link to="/learning-hub/library">
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
    </div>
  );
};

export default LearningHubDashboard;
