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
      <div className="cleo-screen">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--cleo-text-dark))' }}>My Courses</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
            No Enrolled Courses Yet
          </h3>
          <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
          <Button asChild className="cleo-btn-primary">
            <Link to="/heycleo/courses">
              Browse Courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cleo-screen space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
          My Courses
          <span className="ml-3 text-sm font-normal px-3 py-1 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--cleo-green-soft)), hsl(195 80% 90%))' }}>
            {enrolledCourses.length}
          </span>
        </h2>
        <Button asChild className="cleo-btn-outline">
          <Link to="/heycleo/my-courses">
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
