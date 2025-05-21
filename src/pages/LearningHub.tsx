
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Check if user has admin privileges
  const userRoles = profile?.roles?.map(role => role.role) || [];
  const isAdmin = userRoles.some(role => ['admin', 'owner', 'tutor'].includes(role));

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Learning Hub" subtitle="Access educational resources and courses" />
        
        {isAdmin && (
          <Button onClick={() => navigate('/learning-hub/create')}>
            Create New Course
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-500">Error loading courses. Please try again later.</p>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses available</h3>
          <p className="text-gray-500 mb-6">
            {isAdmin 
              ? "Create your first course by clicking the button above." 
              : "Check back later for new courses."}
          </p>
          {isAdmin && (
            <Button onClick={() => navigate('/learning-hub/create')}>
              Create Your First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: Course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-100 relative">
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url} 
                    alt={course.title} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <Badge 
                  variant="outline" 
                  className={`absolute top-2 right-2 ${getStatusColor(course.status)}`}
                >
                  {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.description || "No description available"}
                </CardDescription>
              </CardHeader>
              
              <CardFooter className="mt-auto">
                <Button 
                  onClick={() => navigate(`/learning-hub/course/${course.id}`)} 
                  className="w-full"
                  variant={course.status === 'published' ? "default" : "outline"}
                  disabled={course.status !== 'published' && !isAdmin}
                >
                  {course.status === 'published' ? "Start Learning" : "Preview Course"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningHub;
