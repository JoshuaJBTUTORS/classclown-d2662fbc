
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import { BookOpen, ChevronLeft, Brain, Search, Filter, Grid, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import CourseCard from '@/components/learningHub/CourseCard';
import AIAssessmentManager from '@/components/learningHub/AIAssessmentManager';
import { Badge } from '@/components/ui/badge';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Filter courses by selected subject and search term
  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSubject = activeSubject === 'All Courses' || course.subject === activeSubject;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(-1)} 
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Learning Hub</h1>
                  <p className="text-gray-600 mt-1">Access educational resources and courses</p>
                </div>
              </div>
              
              {hasAdminPrivileges && activeMainTab === 'courses' && (
                <Button 
                  onClick={() => navigate('/create-course')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Create New Course
                </Button>
              )}
            </div>

            {/* Main tabs */}
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              <div className="border-b border-gray-200 mb-8">
                <TabsList className="h-12 bg-transparent p-0">
                  <TabsTrigger 
                    value="courses" 
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
                  >
                    <BookOpen className="h-4 w-4" />
                    Courses
                  </TabsTrigger>
                  {isOwner && (
                    <TabsTrigger 
                      value="ai-assessments" 
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none"
                    >
                      <Brain className="h-4 w-4" />
                      AI Assessments
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="courses" className="space-y-6">
                {/* Filters and Search */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                      {subjects.map((subject) => (
                        <button
                          key={subject}
                          onClick={() => setActiveSubject(subject)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSubject === subject
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                          }`}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search courses..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="rounded-r-none"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Stats */}
                {filteredCourses && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{filteredCourses.length} courses found</span>
                    {searchTerm && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Searching: "{searchTerm}"
                      </Badge>
                    )}
                    {activeSubject !== 'All Courses' && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {activeSubject}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Course Content */}
                {isLoading ? (
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <Skeleton className="h-48 w-full" />
                        <div className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3 mb-4" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                    <div className="text-red-500 mb-4">
                      <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading courses</h3>
                    <p className="text-red-600">Please try again later or contact support if the issue persists.</p>
                  </div>
                ) : filteredCourses?.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {searchTerm 
                        ? `No courses found for "${searchTerm}"` 
                        : activeSubject === 'All Courses' 
                          ? "No courses available" 
                          : `No ${activeSubject} courses available`}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {hasAdminPrivileges 
                        ? "Create your first course to get started with the learning platform." 
                        : searchTerm
                          ? "Try adjusting your search terms or browse all courses."
                          : "Check back later for new courses and learning materials."}
                    </p>
                    {hasAdminPrivileges && !searchTerm && (
                      <Button 
                        onClick={() => navigate('/create-course')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Create Your First Course
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                    {filteredCourses?.map((course: Course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isAdmin={hasAdminPrivileges}
                        hasProgress={false}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {isOwner && (
                <TabsContent value="ai-assessments">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <AIAssessmentManager />
                  </div>
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
