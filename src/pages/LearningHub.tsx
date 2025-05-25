
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define subject categories
const subjects = [
  'All Courses',
  'GCSE Maths',
  'GCSE English',
  'GCSE Biology',
  'GCSE Chemistry',
  'GCSE Physics',
];

const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, isTutor, isOwner } = useAuth();
  const [activeSubject, setActiveSubject] = useState('All Courses');
  
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

  // Filter courses by selected subject
  const filteredCourses = courses?.filter((course: Course) => {
    if (activeSubject === 'All Courses') return true;
    return course.subject === activeSubject;
  });

  // Use the helper functions from AuthContext instead of checking roles directly
  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  return (
    <div className="container py-8">
      <div className="flex items-center mb-4">
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
      
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Learning Hub" subtitle="Access educational resources and courses" />
        
        {hasAdminPrivileges && (
          <Button onClick={() => navigate('/create-course')}>
            Create New Course
          </Button>
        )}
      </div>

      {/* Subject tabs */}
      <Tabs defaultValue="All Courses" className="mb-8" onValueChange={setActiveSubject} value={activeSubject}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          {subjects.map((subject) => (
            <TabsTrigger key={subject} value={subject} className="mb-2">
              {subject}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
      ) : filteredCourses?.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {activeSubject === 'All Courses' 
              ? "No courses available" 
              : `No ${activeSubject} courses available`}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasAdminPrivileges 
              ? "Create your first course by clicking the button above." 
              : "Check back later for new courses."}
          </p>
          {hasAdminPrivileges && (
            <Button onClick={() => navigate('/create-course')}>
              Create Your First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses?.map((course: Course) => (
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
                {course.subject && (
                  <Badge 
                    className="absolute bottom-2 left-2 bg-blue-500 text-white"
                  >
                    {course.subject}
                  </Badge>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.description || "No description available"}
                </CardDescription>
              </CardHeader>
              
              <CardFooter className="mt-auto">
                <Button 
                  onClick={() => navigate(`/course/${course.id}`)} 
                  className="w-full"
                  variant={course.status === 'published' ? "default" : "outline"}
                  disabled={course.status !== 'published' && !hasAdminPrivileges}
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
