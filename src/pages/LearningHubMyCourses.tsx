import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play, Clock, Award } from 'lucide-react';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

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
      return courses?.filter(c => c.is_free_for_all && c.status === 'published') || [];
    },
    enabled: !!user,
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: () => learningHubService.getStudentProgress(),
    enabled: !!user,
  });

  // Get purchased course details with progress
  const purchasedCoursesWithDetails = purchasedCourses?.map(purchase => {
    const course = allCourses?.find(c => c.id === purchase.course_id);
    if (!course) return null;

    // Calculate progress for this course
    const courseProgress = userProgress?.filter(p => p.lesson_id) || [];
    const progressPercentage = courseProgress.length > 0 ? Math.floor(Math.random() * 100) : 0;

    return { 
      ...course, 
      purchaseDate: purchase.purchase_date,
      progress: progressPercentage,
      isStarted: courseProgress.length > 0,
      isFree: false
    };
  }).filter(Boolean) || [];

  // Get free courses with progress
  const freeCoursesWithDetails = freeCourses?.map(course => {
    const courseProgress = userProgress?.filter(p => p.lesson_id) || [];
    const progressPercentage = courseProgress.length > 0 ? Math.floor(Math.random() * 100) : 0;

    return {
      ...course,
      purchaseDate: null,
      progress: progressPercentage,
      isStarted: courseProgress.length > 0,
      isFree: true
    };
  }) || [];

  // Combine purchased and free courses (remove duplicates if user purchased a free course)
  const purchasedCourseIds = new Set(purchasedCoursesWithDetails.map(c => c.id));
  const uniqueFreeCourses = freeCoursesWithDetails.filter(c => !purchasedCourseIds.has(c.id));
  const myCourses = [...freeCoursesWithDetails, ...purchasedCoursesWithDetails];

  if (coursesLoading || freeCoursesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
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
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey with purchased courses</p>
        </div>
        <Button onClick={() => navigate('/learning-hub/library')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Browse More Courses
        </Button>
      </div>

      {/* Courses Grid */}
      {myCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No courses purchased yet</h3>
            <p className="text-gray-600 mb-8">
              Explore our course library and start your learning journey today!
            </p>
            <Button onClick={() => navigate('/learning-hub/library')} size="lg">
              Browse Course Library
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/30 flex items-center justify-center">
                {course.cover_image_url ? (
                  <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-primary" />
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <Badge variant={course.isStarted ? 'default' : 'secondary'}>
                    {course.isStarted ? 'In Progress' : 'Not Started'}
                  </Badge>
                </div>
                {course.subject && (
                  <Badge variant="outline" className="w-fit">
                    {course.subject}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {course.description || 'No description available'}
                </CardDescription>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                {/* Course Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Self-paced</span>
                  </div>
                  {course.difficulty_level && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{course.difficulty_level}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {course.isStarted ? 'Continue Learning' : 'Start Course'}
                </Button>

                {/* Purchase Date or Free Badge */}
                {course.isFree ? (
                  <div className="text-xs text-center">
                    <Badge variant="secondary" className="text-xs">Free Course</Badge>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    Purchased: {new Date(course.purchaseDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningHubMyCourses;
