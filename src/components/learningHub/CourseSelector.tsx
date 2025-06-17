
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';
import SelectableCourseCard from './SelectableCourseCard';

interface Course {
  id: string;
  title: string;
  subject: string;
}

interface CourseSelectorProps {
  selectedCourseId: string | null;
  onCourseChange: (courseId: string | null) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ selectedCourseId, onCourseChange }) => {
  const { user, userRole } = useAuth();

  // Get user's accessible courses - only purchased courses for all users
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['user-purchased-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('🔍 CourseSelector: Fetching purchased courses for user:', user.id);

      try {
        // For all users (including owners), only show purchased courses in Personal Growth
        const purchases = await paymentService.getUserPurchases();
        console.log('💰 User purchases:', purchases);
        
        const courseIds = purchases.map(p => p.course_id);

        if (courseIds.length === 0) {
          console.log('📝 No purchases found for user');
          return [];
        }

        const { data, error } = await supabase
          .from('courses')
          .select('id, title, subject')
          .in('id', courseIds)
          .eq('status', 'published')
          .order('title');

        console.log('🛒 Purchased courses query result:', { data, error });

        if (error) {
          console.error('❌ Error fetching purchased courses:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('❌ Error fetching user courses:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Log the final result
  console.log('📊 CourseSelector final state:', {
    isLoading,
    error,
    coursesCount: courses?.length,
    courses,
    userRole,
    userId: user?.id
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('💥 CourseSelector error:', error);
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Error Loading Courses</h3>
              <p className="text-sm text-gray-600">
                Failed to load courses. Please try refreshing the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No Courses Available</h3>
              <p className="text-sm text-gray-600">
                You haven't purchased any courses yet. Visit the course library to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gray-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">Select a Course to Analyze</h2>
            <p className="text-sm text-gray-600">Click a card to view detailed analytics for a specific course or for all your courses combined.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <SelectableCourseCard
            isAllCoursesCard
            isSelected={selectedCourseId === null}
            onClick={() => onCourseChange(null)}
          />
          {courses.map((course) => (
            <SelectableCourseCard
              key={course.id}
              course={course}
              isSelected={selectedCourseId === course.id}
              onClick={() => onCourseChange(course.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseSelector;
