import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import { BookOpen, ChevronLeft, Brain, Filter, Grid, List, Home, GraduationCap, Sparkles, Search, School, Award, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CourseCard from '@/components/learningHub/CourseCard';
import AIAssessmentManager from '@/components/learningHub/AIAssessmentManager';
import { Badge } from '@/components/ui/badge';
import { EDUCATIONAL_STAGES, SUBJECT_AREAS, getSubjectArea, isValidLessonSubject } from '@/constants/subjects';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import LearningHubErrorBoundary from '@/components/learningHub/LearningHubErrorBoundary';

const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, isTutor, isOwner, isLearningHubOnly } = useAuth();
  const hasAdminPrivileges = isAdmin || isOwner || isTutor;
  const isMobile = useIsMobile();
  
  const [activeStage, setActiveStage] = useState<string>('all');
  const [activeSubjectArea, setActiveSubjectArea] = useState('All Subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('courses');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
    retry: 3,
    retryDelay: 1000,
  });

  const handleBookTrial = () => {
    navigate('/book-trial');
  };

  // Filter courses by stage, subject area, and search query
  const filteredCourses = courses?.filter((course: Course) => {
    // Stage filter
    if (activeStage !== 'all') {
      const stageData = EDUCATIONAL_STAGES[activeStage as keyof typeof EDUCATIONAL_STAGES];
      if (!stageData || !course.subject || !isValidLessonSubject(course.subject)) return false;
      
      // Type-safe check if the course subject is in the stage's subjects array
      const stageSubjects = stageData.subjects as readonly string[];
      if (!stageSubjects.includes(course.subject)) return false;
    }
    
    // Subject area filter
    if (activeSubjectArea !== 'All Subjects') {
      const courseSubjectArea = getSubjectArea(course.subject || '');
      if (courseSubjectArea !== activeSubjectArea) return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.subject?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStageIcon = (stageKey: string) => {
    switch (stageKey) {
      case '11_plus': return GraduationCap;
      case 'ks2': return BookOpen;
      case 'ks3': return School;
      case 'gcse': return Award;
      default: return BookOpen;
    }
  };

  // Mobile Filter Sheet Component
  const MobileFiltersSheet = () => (
    <Sheet open={showFilters} onOpenChange={setShowFilters}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filters & Search</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 pt-6">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search Courses</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Subject Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">Subject Area</label>
            <Select value={activeSubjectArea} onValueChange={setActiveSubjectArea}>
              <SelectTrigger>
                <SelectValue placeholder="Subject area" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Educational Stages */}
          <div>
            <label className="text-sm font-medium mb-2 block">Educational Stage</label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveStage('all');
                  setShowFilters(false);
                }}
                className={`w-full p-3 rounded-lg text-left transition-all duration-200 border ${
                  activeStage === 'all'
                    ? 'bg-primary text-white border-transparent'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">All Courses</span>
                </div>
              </button>
              
              {Object.entries(EDUCATIONAL_STAGES).slice(2).map(([key, stage]) => {
                const IconComponent = getStageIcon(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveStage(key);
                      setShowFilters(false);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 border ${
                      activeStage === key
                        ? 'bg-primary text-white border-transparent'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                     <div className="flex items-center gap-3">
                       <IconComponent className="h-5 w-5" />
                       <span className="font-medium">{stage.label}</span>
                     </div>
                   </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <BookOpen className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Learning Hub</h2>
          <p className="text-gray-600 mb-4">There was an error loading the learning hub content.</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LearningHubErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Enhanced Header with mobile-first responsive design */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/')} 
                  className="text-gray-600 hover:text-gray-900 hover:bg-white/60 p-2 sm:px-3"
                >
                  <Home className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                <div className="h-6 w-px bg-gray-300 hidden sm:block" />
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">Learning Hub</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
                      {isLearningHubOnly 
                        ? "Explore educational resources and book a trial lesson to unlock full access"
                        : "Access educational resources and premium courses"
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {hasAdminPrivileges && activeMainTab === 'courses' && (
                <Button 
                  onClick={() => navigate('/course/create')}
                  className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 shadow-lg w-full sm:w-auto"
                  size={isMobile ? "default" : "default"}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Create New Course</span>
                </Button>
              )}
            </div>

            {/* Welcome message for learning_hub_only users - mobile optimized */}
            {isLearningHubOnly && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Welcome to JB Tutors Learning Hub!</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      Explore our educational resources. Ready for personalized tutoring? Book a free trial lesson to unlock calendar and homework features.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={handleBookTrial}
                  >
                    Book Trial Lesson
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Main tabs with mobile-friendly styling */}
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl mb-4 sm:mb-6 shadow-xl overflow-hidden">
              <TabsList className="h-14 sm:h-16 bg-transparent p-0 w-full justify-start border-b border-gray-200/50">
                <TabsTrigger 
                  value="courses" 
                  className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 text-gray-600 data-[state=active]:text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/20 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-medium text-sm sm:text-base"
                >
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Courses</span>
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger 
                    value="ai-assessments" 
                    className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 text-gray-600 data-[state=active]:text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/20 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-medium text-sm sm:text-base"
                  >
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">AI Assessments</span>
                    <span className="sm:hidden">AI</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="courses" className="space-y-4 sm:space-y-6">
              {/* Mobile-first Educational Stage Filters */}
              <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Choose Your Educational Stage</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Browse courses organized by UK education levels</p>
                </div>
                
                {/* Desktop: Grid layout, Mobile: Show first few + "More" button */}
                <div className="mb-4 sm:mb-6">
                  {/* Mobile: Compact stage selector */}
                  {isMobile ? (
                    <div className="space-y-3">
                      {/* Show "All" and first 2 stages */}
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => setActiveStage('all')}
                          className={`p-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm ${
                            activeStage === 'all'
                              ? 'bg-primary text-white border-transparent shadow-lg'
                              : 'bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5" />
                            <div>
                              <span className="font-medium block">All Courses</span>
                              <span className="text-xs opacity-80">View all available courses</span>
                            </div>
                          </div>
                        </button>
                        
                        {Object.entries(EDUCATIONAL_STAGES).slice(0, 2).map(([key, stage]) => {
                          const IconComponent = getStageIcon(key);
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveStage(key)}
                              className={`p-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm ${
                                activeStage === key
                                  ? 'bg-primary text-white border-transparent shadow-lg'
                                  : 'bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-primary/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5" />
                                <div>
                                  <span className="font-medium block">{stage.label}</span>
                                  <span className="text-xs opacity-80">{stage.description}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* More stages button */}
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Menu className="h-4 w-4 mr-2" />
                            More Educational Stages
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[60vh]">
                          <SheetHeader>
                            <SheetTitle>Select Educational Stage</SheetTitle>
                          </SheetHeader>
                          <div className="space-y-2 pt-6">
                            {Object.entries(EDUCATIONAL_STAGES).slice(2).map(([key, stage]) => {
                              const IconComponent = getStageIcon(key);
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setActiveStage(key);
                                  }}
                                  className={`w-full p-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm ${
                                    activeStage === key
                                      ? 'bg-primary text-white border-transparent shadow-lg'
                                      : 'bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-primary/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <IconComponent className="h-5 w-5" />
                                    <div>
                                      <span className="font-medium block">{stage.label}</span>
                                      <span className="text-xs opacity-80">{stage.description}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  ) : (
                    /* Desktop: Full grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <button
                        onClick={() => setActiveStage('all')}
                        className={`p-4 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm ${
                          activeStage === 'all'
                            ? 'bg-primary text-white border-transparent shadow-lg'
                            : 'bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="h-5 w-5" />
                          <span className="font-medium">All Courses</span>
                        </div>
                        <p className="text-sm opacity-80">View all available courses</p>
                      </button>
                      
                      {Object.entries(EDUCATIONAL_STAGES).map(([key, stage]) => {
                        const IconComponent = getStageIcon(key);
                        return (
                          <button
                            key={key}
                            onClick={() => setActiveStage(key)}
                            className={`p-4 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm ${
                              activeStage === key
                                ? 'bg-primary text-white border-transparent shadow-lg'
                                : 'bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <IconComponent className="h-5 w-5" />
                              <span className="font-medium">{stage.label}</span>
                            </div>
                            <p className="text-sm opacity-80">{stage.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mobile-optimized Secondary Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
                    {/* Mobile: Filter button, Desktop: Inline search */}
                    {isMobile ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/60 backdrop-blur-sm border-gray-200/50 h-12"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowFilters(true)}
                          className="h-12 bg-white/60 backdrop-blur-sm border-gray-200/50"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Filters & Stage
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 max-w-md">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Search courses..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 bg-white/60 backdrop-blur-sm border-gray-200/50"
                            />
                          </div>
                        </div>
                        
                        <Select value={activeSubjectArea} onValueChange={setActiveSubjectArea}>
                          <SelectTrigger className="w-full sm:w-48 bg-white/60 backdrop-blur-sm border-gray-200/50">
                            <SelectValue placeholder="Subject area" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECT_AREAS.map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  
                  {/* View mode toggle - responsive sizing */}
                  <div className="flex items-center border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none h-10 sm:h-12 px-3 sm:px-4"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none h-10 sm:h-12 px-3 sm:px-4"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Course Stats - mobile responsive */}
              {filteredCourses && (
                <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap px-2 sm:px-0">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border border-white/20">
                    <span className="font-medium text-gray-700 text-xs sm:text-sm">{filteredCourses.length} courses found</span>
                  </div>
                  {activeStage !== 'all' && (
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 backdrop-blur-sm px-2 sm:px-3 py-1 text-xs">
                      {EDUCATIONAL_STAGES[activeStage as keyof typeof EDUCATIONAL_STAGES]?.label}
                    </Badge>
                  )}
                  {activeSubjectArea !== 'All Subjects' && (
                    <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 backdrop-blur-sm px-2 sm:px-3 py-1 text-xs">
                      {activeSubjectArea}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 backdrop-blur-sm px-2 sm:px-3 py-1 text-xs">
                      "{searchQuery}"
                    </Badge>
                  )}
                </div>
              )}

              {/* Enhanced Course Content - responsive grid */}
              {isLoading ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4 sm:gap-6`}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl">
                      <Skeleton className="h-32 sm:h-48 w-full" />
                      <div className="p-4 sm:p-6">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <Skeleton className="h-10 sm:h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white/90 backdrop-blur-sm border border-red-200/50 rounded-2xl p-8 sm:p-12 text-center shadow-xl">
                  <div className="text-red-500 mb-6">
                    <BookOpen className="mx-auto h-12 sm:h-16 w-12 sm:w-16 mb-4 opacity-50" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-red-800 mb-3">Error loading courses</h3>
                  <p className="text-red-600 text-base sm:text-lg">Please try again later or contact support if the issue persists.</p>
                </div>
              ) : filteredCourses?.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-8 sm:p-12 text-center shadow-xl">
                  <BookOpen className="mx-auto h-16 sm:h-20 w-16 sm:w-20 text-gray-300 mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                    No courses found
                  </h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-base sm:text-lg leading-relaxed">
                    {searchQuery || activeStage !== 'all' || activeSubjectArea !== 'All Subjects'
                      ? "Try adjusting your filters or search terms to find more courses."
                      : hasAdminPrivileges 
                        ? "Create your first course to get started with the learning platform." 
                        : "Check back later for new courses and learning materials."
                    }
                  </p>
                  {hasAdminPrivileges && !searchQuery && activeStage === 'all' && activeSubjectArea === 'All Subjects' && (
                    <Button 
                      onClick={() => navigate('/course/create')}
                      className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-medium shadow-lg"
                    >
                      <Sparkles className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Create Your First Course
                    </Button>
                  )}
                </div>
              ) : (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4 sm:gap-6`}>
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
                <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-8 shadow-xl">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg backdrop-blur-sm">
                        <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">AI Assessment Manager</h2>
                    </div>
                    <p className="text-gray-600 text-base sm:text-lg">Create and manage AI-powered assessments for your students</p>
                  </div>
                  <AIAssessmentManager />
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          {/* Mobile Filters Sheet */}
          <MobileFiltersSheet />
        </div>
      </div>
    </LearningHubErrorBoundary>
  );
};

export default LearningHub;
