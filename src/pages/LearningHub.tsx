
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import { BookOpen, ChevronLeft, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import CourseCard from '@/components/learningHub/CourseCard';
import AIAssessmentManager from '@/components/learningHub/AIAssessmentManager';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('courses');
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Filter courses by selected subject
  const filteredCourses = courses?.filter((course: Course) => {
    if (activeSubject === 'All Courses') return true;
    return course.subject === activeSubject;
  });

  // Use the helper functions from AuthContext instead of checking roles directly
  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
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
              
              {hasAdminPrivileges && activeMainTab === 'courses' && (
                <Button onClick={() => navigate('/create-course')}>
                  Create New Course
                </Button>
              )}
            </div>

            {/* Main tabs */}
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="ai-assessments" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Assessments
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="courses" className="space-y-6">
                {/* Subject tabs for courses */}
                <Tabs value={activeSubject} onValueChange={setActiveSubject}>
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
                      <div key={i} className="overflow-hidden border rounded-lg">
                        <div className="h-40 bg-gray-200">
                          <Skeleton className="h-full w-full" />
                        </div>
                        <div className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </div>
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
                      <CourseCard
                        key={course.id}
                        course={course}
                        isAdmin={hasAdminPrivileges}
                        hasProgress={false} // TODO: Implement progress checking
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {isOwner && (
                <TabsContent value="ai-assessments">
                  <AIAssessmentManager />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LearningHub;
