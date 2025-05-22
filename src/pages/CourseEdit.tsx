
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { learningHubService } from '@/services/learningHubService';

const CourseEdit: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back
          </Button>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !course) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/learning-hub')} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back to Learning Hub
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load course information. Please try again.</p>
            <Button 
              onClick={() => navigate('/learning-hub')} 
              className="mt-4"
            >
              Return to Learning Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/learning-hub/course/${courseId}`)} 
          className="mr-2"
        >
          <ChevronLeft className="mr-1" />
          Back to Course
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Edit Course: {course.title}</h1>
      <p className="text-gray-500 mb-6">Make changes to your course structure and content</p>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center p-8 text-gray-500">
                Course editing form will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules & Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center p-8 text-gray-500">
                Module and lesson management interface will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Quizzes & Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center p-8 text-gray-500">
                Quiz creation and management interface will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center p-8 text-gray-500">
                Course settings and publication options will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseEdit;
