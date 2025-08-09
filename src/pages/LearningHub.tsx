
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import CourseCard from '@/components/learningHub/CourseCard';
import LearningHubAccessControl from '@/components/learningHub/LearningHubAccessControl';
import LearningHubSubscriptionModal from '@/components/learningHub/LearningHubSubscriptionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Grid3X3, List, Filter, Star, Clock, Users, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'popular' | 'alphabetical' | 'difficulty';

const LearningHub: React.FC = () => {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  // Check Learning Hub access for non-owners
  const { data: accessInfo, isLoading: accessLoading } = useQuery({
    queryKey: ['learning-hub-access', user?.id],
    queryFn: () => learningHubPaymentService.checkLearningHubAccess(),
    enabled: !!user && !isOwner,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Get user progress for purchased courses
  const { data: userProgress = [] } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: () => learningHubService.getUserProgress(),
    enabled: !!user && (isOwner || accessInfo?.hasAccess),
  });

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    queryClient.invalidateQueries({ queryKey: ['learning-hub-access'] });
    toast({
      title: "Welcome to Learning Hub!",
      description: "Your subscription is now active. Enjoy unlimited access to all courses.",
    });
  };

  const handleGetAccess = () => {
    setShowSubscriptionModal(true);
  };

  // Filter and sort courses
  const filteredAndSortedCourses = React.useMemo(() => {
    let filtered = courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;
      const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty_level === selectedDifficulty;
      
      return matchesSearch && matchesSubject && matchesDifficulty;
    });

    // Sort courses
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popular':
        // For now, sort by path_position as a proxy for popularity
        filtered.sort((a, b) => (a.path_position || 0) - (b.path_position || 0));
        break;
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        filtered.sort((a, b) => {
          const aOrder = difficultyOrder[a.difficulty_level as keyof typeof difficultyOrder] || 0;
          const bOrder = difficultyOrder[b.difficulty_level as keyof typeof difficultyOrder] || 0;
          return aOrder - bOrder;
        });
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return filtered;
  }, [courses, searchTerm, selectedSubject, selectedDifficulty, sortBy]);

  // Get unique subjects for filter
  const subjects = React.useMemo(() => {
    const uniqueSubjects = [...new Set(courses.map(course => course.subject).filter(Boolean))];
    return uniqueSubjects;
  }, [courses]);

  const hasProgress = (courseId: string) => {
    return userProgress.some(progress => progress.course_id === courseId);
  };

  if (!user) {
    return (
      <LearningHubAccessControl>
        <div>Please sign in to access Learning Hub</div>
      </LearningHubAccessControl>
    );
  }

  // Show loading state
  if (coursesLoading || (!isOwner && accessLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check access for non-owners
  if (!isOwner && !accessInfo?.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Learning Hub
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Unlock unlimited access to all our courses and accelerate your learning journey with expert-curated content.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Unlimited Courses</h3>
                  <p className="text-sm text-gray-600">Access to our complete library of courses across all subjects</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Expert Tutors</h3>
                  <p className="text-sm text-gray-600">Learn from experienced educators and industry professionals</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor your learning progress and earn completion certificates</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Card */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Learning Hub Access</CardTitle>
                <CardDescription>
                  {accessInfo?.trialEligible ? 'Start with a 7-day free trial' : 'Monthly subscription'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">£25</div>
                  <div className="text-sm text-gray-500">per month</div>
                  {accessInfo?.trialEligible && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        7-day free trial
                      </Badge>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Unlimited access to all courses
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    New courses added regularly
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Progress tracking and certificates
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Cancel anytime
                  </li>
                </ul>

                <Button 
                  onClick={handleGetAccess}
                  className="w-full"
                  size="lg"
                >
                  {accessInfo?.trialEligible ? 'Start Free Trial' : 'Get Access'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  {accessInfo?.trialEligible 
                    ? 'No commitment. Cancel anytime during your trial.'
                    : 'Cancel your subscription at any time.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <LearningHubSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Hub</h1>
            <p className="text-gray-600">Explore our comprehensive course library</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <BookOpen className="w-3 h-3 mr-1" />
                {courses.length} Courses
              </Badge>
              {!isOwner && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Premium Access
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Subject Filter */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject!}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Difficulty Filter */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="difficulty">By Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedCourses.length} of {courses.length} courses
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid/List */}
        {filteredAndSortedCourses.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredAndSortedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                hasProgress={hasProgress(course.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('all');
                  setSelectedDifficulty('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LearningHub;
