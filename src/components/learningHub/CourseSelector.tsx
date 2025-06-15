
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
  const { data: courses, isLoading } = useQuery({
    queryKey: ['user-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Owners can see all courses
      if (userRole === 'owner') {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, subject')
          .eq('status', 'published')
          .order('title');

        if (error) throw error;
        return data || [];
      }

      // Regular users can only see purchased courses
      try {
        const purchases = await paymentService.getUserPurchases();
        const courseIds = purchases.map(p => p.course_id);

        if (courseIds.length === 0) return [];

        const { data, error } = await supabase
          .from('courses')
          .select('id, title, subject')
          .in('id', courseIds)
          .eq('status', 'published')
          .order('title');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching user courses:', error);
        return [];
      }
    },
    enabled: !!user,
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
                  ? 'No published courses found.'
                  : 'Purchase a course to access assessment analytics.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            </label>
            <Select value={selectedCourseId || ''} onValueChange={(value) => onCourseChange(value || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-xs text-gray-500">{course.subject}</span>
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
