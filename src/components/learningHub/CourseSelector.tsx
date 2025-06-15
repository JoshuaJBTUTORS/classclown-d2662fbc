
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';

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

  // Get user's accessible courses
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['user-courses', user?.id, userRole],
    queryFn: async () => {
      if (!user) return [];

      console.log('🔍 CourseSelector: Fetching courses for user role:', userRole);

      // Owners can see all courses (including drafts for testing)
      if (userRole === 'owner') {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, subject, status')
          .order('title');

        console.log('👑 Owner courses query result:', { data, error });

        if (error) {
          console.error('❌ Error fetching owner courses:', error);
          throw error;
        }
        return data || [];
      }

      // Regular users can only see purchased courses
      try {
        console.log('👤 Fetching purchased courses for regular user');
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
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
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
                {userRole === 'owner' 
                  ? 'No courses found in the database. Create some courses first.'
                  : 'Purchase a course to access assessment analytics.'
                }
              </p>
              {userRole === 'owner' && (
                <p className="text-xs text-blue-600 mt-1">
                  Debug: User role: {userRole}, User ID: {user?.id}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleValueChange = (value: string) => {
    if (value === 'all-courses') {
      onCourseChange(null);
    } else {
      onCourseChange(value);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium text-gray-900 block mb-2">
              Select Course to Analyze
              {userRole === 'owner' && (
                <span className="text-xs text-blue-600 ml-2">
                  (Owner: {courses.length} courses available)
                </span>
              )}
            </label>
            <Select 
              value={selectedCourseId || 'all-courses'} 
              onValueChange={handleValueChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-courses">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-xs text-gray-500">
                        {course.subject}
                        {userRole === 'owner' && (course as any).status && (
                          <span className="ml-1 text-blue-500">({(course as any).status})</span>
                        )}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseSelector;
