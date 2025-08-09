
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { Course } from '@/types/course';
import CourseCard from '@/components/learningHub/CourseCard';
import LearningHubSubscriptionModal from '@/components/learningHub/LearningHubSubscriptionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BookOpen, Search, Grid3X3, List } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { EDUCATIONAL_STAGES } from '@/constants/subjects';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'popular' | 'alphabetical' | 'difficulty';
type EducationalStage = 'all' | '11_plus' | 'ks2' | 'ks3' | 'gcse';

const LearningHub: React.FC = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<EducationalStage>('all');
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
    queryKey: ['course-progress', user?.id],
    queryFn: () => learningHubService.getCourseProgress(user?.id),
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
      
      // Filter by educational stage
      let matchesStage = true;
      if (selectedStage !== 'all' && course.subject) {
        const stageData = EDUCATIONAL_STAGES[selectedStage];
        matchesStage = stageData?.subjects?.includes(course.subject) || false;
      }
      
      return matchesSearch && matchesSubject && matchesStage;
    });

    // Sort courses
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popular':
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
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
  }, [courses, searchTerm, selectedSubject, selectedStage, sortBy]);

  // Get unique subjects for filter
  const subjects = React.useMemo(() => {
    const uniqueSubjects = [...new Set(courses.map(course => course.subject).filter(Boolean))];
    return uniqueSubjects;
  }, [courses]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to access Learning Hub</h1>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (coursesLoading || (!isOwner && accessLoading)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasAccess = isOwner || accessInfo?.hasAccess;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <ToggleGroup type="single" value="courses" className="bg-gray-100 p-1 rounded-lg">
            <ToggleGroupItem 
              value="courses" 
              className="data-[state=on]:bg-white data-[state=on]:shadow-sm px-6 py-2"
            >
              Courses
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="learning-path" 
              className="data-[state=on]:bg-white data-[state=on]:shadow-sm px-6 py-2"
              onClick={() => navigate('/learning-hub/revision')}
            >
              Learning Path
            </ToggleGroupItem>
          </ToggleGroup>
          
          {!hasAccess && (
            <Button onClick={handleGetAccess} className="bg-primary hover:bg-primary/90">
              Get Access
            </Button>
          )}
        </div>

        {/* Educational Stage Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Your Educational Stage</CardTitle>
            <CardDescription>
              Filter courses by your educational level to find the most relevant content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStage === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('all')}
                className="rounded-full"
              >
                All Courses
              </Button>
              <Button
                variant={selectedStage === '11_plus' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('11_plus')}
                className="rounded-full"
              >
                11 Plus
              </Button>
              <Button
                variant={selectedStage === 'ks2' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('ks2')}
                className="rounded-full"
              >
                Key Stage 2
              </Button>
              <Button
                variant={selectedStage === 'ks3' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('ks3')}
                className="rounded-full"
              >
                Key Stage 3
              </Button>
              <Button
                variant={selectedStage === 'gcse' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('gcse')}
                className="rounded-full"
              >
                GCSE & Year 11
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject!}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Controls */}
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

        {/* Course Count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            <BookOpen className="w-3 h-3 mr-1" />
            {filteredAndSortedCourses.length} courses found
          </Badge>
        </div>

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
                  setSelectedStage('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <LearningHubSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default LearningHub;
