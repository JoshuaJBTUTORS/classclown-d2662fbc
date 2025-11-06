import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { courseMatchingService } from '@/services/courseMatchingService';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export const EnrolledCoursesSection = () => {
  const { user } = useAuth();

  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ['enrolled-courses', user?.id],
    queryFn: () => courseMatchingService.getUserCourses(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!enrolledCourses || enrolledCourses.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h2>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrolled Courses Yet</h3>
            <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
            <Button asChild>
              <Link to="/learning-hub/courses">
                Browse Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          My Enrolled Courses
          <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {enrolledCourses.length}
          </span>
        </h2>
        <Button asChild variant="outline">
          <Link to="/learning-hub/my-courses">
            View All
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course: any) => (
          <CourseCard 
            key={course.id} 
            course={course}
            hasProgress={true}
            progress={course.progress || 0}
          />
        ))}
      </div>
    </div>
  );
};
