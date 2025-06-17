import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Award, BookOpen, RefreshCw, Calendar, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';
import TopicPerformanceHeatMap from '@/components/learningHub/TopicPerformanceHeatMap';
import CourseSelector from '@/components/learningHub/CourseSelector';
import CourseGradeCard from '@/components/learningHub/CourseGradeCard';
import { useAuth } from '@/contexts/AuthContext';
import { topicPerformanceService } from '@/services/topicPerformanceService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ModulePerformanceRadarChart from '@/components/learningHub/ModulePerformanceRadarChart';
import RevisionSetupWizard from '@/components/learningHub/RevisionSetupWizard';
import RevisionCalendar from '@/components/learningHub/RevisionCalendar';
import { revisionCalendarService } from '@/services/revisionCalendarService';
import { Badge } from '@/components/ui/badge';

const LearningHubAssessments = () => {
  const { userRole, user } = useAuth();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [isGeneratingImprovements, setIsGeneratingImprovements] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Ensure only authenticated users can access this data
  const isAuthenticated = !!user;

  const assessmentFilters = {
    dateRange: { from: null, to: null },
    selectedStudents: user ? [user.id] : [], // Filter by current user only
    selectedSubjects: []
  };

  // Get course-specific stats - filtered by user
  const { data: courseStats, isLoading: statsLoading } = useQuery({
    queryKey: ['course-assessment-stats', selectedCourseId, user?.id],
    queryFn: async () => {
      if (!user || !selectedCourseId) return null;

      // Get course details
      const { data: course } = await supabase
        .from('courses')
        .select('subject, title')
        .eq('id', selectedCourseId)
        .single();

      if (!course) return null;

      // Get assessment sessions for this course - FILTERED BY USER
      const { data: sessions } = await supabase
        .from('assessment_sessions')
        .select(`
          total_marks_achieved,
          total_marks_available,
          completed_at,
          ai_assessments(subject)
        `)
        .eq('user_id', user.id) // CRITICAL: Filter by current user
        .eq('status', 'completed')
        .not('completed_at', 'is', null);

      // Filter by course subject
      const courseSessions = sessions?.filter(session => 
        session.ai_assessments?.subject === course.subject
      ) || [];

      if (courseSessions.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          improvementRate: 0,
          completionRate: 0
        };
      }

      const scores = courseSessions.map(session => {
        const achieved = Number(session.total_marks_achieved) || 0;
        const available = Number(session.total_marks_available) || 1;
        return (achieved / available) * 100;
      });

      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      // Calculate improvement (last 3 vs first 3)
      const improvementRate = courseSessions.length >= 3 ? 
        Math.round(scores.slice(-3).reduce((a, b) => a + b, 0) / 3 - scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3) : 0;

      return {
        totalAssessments: courseSessions.length,
        averageScore,
        improvementRate,
        completionRate: 100 // All sessions are completed
      };
    },
    enabled: isAuthenticated && !!selectedCourseId,
  });

  // Default stats for when no course is selected
  const defaultStats = {
    totalAssessments: 0,
    averageScore: 0,
    improvementRate: 0,
    completionRate: 0
  };

  const stats = courseStats || defaultStats;

  // Get topic performance data for selected course - user filtered
  const { data: topicPerformance, isLoading: topicLoading, refetch: refetchTopics } = useQuery({
    queryKey: ['topic-performance', selectedCourseId, user?.id],
    queryFn: () => topicPerformanceService.getUserTopicPerformance(selectedCourseId || undefined),
    enabled: isAuthenticated,
  });

  // Get module performance for radar chart - user filtered
  const { data: modulePerformance, isLoading: modulePerformanceLoading } = useQuery({
    queryKey: ['module-performance', selectedCourseId, user?.id],
    queryFn: () => topicPerformanceService.getCourseModulePerformance(selectedCourseId),
    enabled: isAuthenticated && !!selectedCourseId,
  });

  // Get worst performing topics for improvement section - user filtered
  const { data: worstTopics } = useQuery({
    queryKey: ['worst-topics', selectedCourseId, user?.id],
    queryFn: () => topicPerformanceService.getWorstPerformingTopics(5, selectedCourseId || undefined),
    enabled: isAuthenticated,
  });

  // --- Revision Planner Data - User Filtered ---
  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['revision-schedules', user?.id],
    queryFn: () => revisionCalendarService.getRevisionSchedules(),
    enabled: isAuthenticated,
  });
  const { data: revisionSessions } = useQuery({
    queryKey: ['revision-sessions', user?.id],
    queryFn: () => revisionCalendarService.getRevisionSessions(),
    enabled: isAuthenticated,
  });
  const { data: allWorstTopics, isLoading: allWorstTopicsLoading } = useQuery({
    queryKey: ['worst-topics-all', user?.id],
    queryFn: () => topicPerformanceService.getWorstPerformingTopics(20),
    enabled: isAuthenticated,
  });

  const activeSchedule = schedules?.find(s => s.status === 'active');

  const revisionStats = useMemo(() => {
    if (!revisionSessions) return { total: 0, completed: 0, upcoming: 0, streak: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const completed = revisionSessions.filter(s => s.status === 'completed').length;
    const upcoming = revisionSessions.filter(s => s.session_date >= today && s.status === 'scheduled').length;
    
    const completedSessions = revisionSessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    
    let streak = 0;
    if (completedSessions.length > 0) {
      let currentDate = new Date();
      if (completedSessions.some(s => new Date(s.session_date).toDateString() === currentDate.toDateString())) {
        streak = 1;
      }
      currentDate.setDate(currentDate.getDate() - 1);
      
      let consecutive = true;
      while(consecutive && completedSessions.length > 0) {
        if (completedSessions.some(s => new Date(s.session_date).toDateString() === currentDate.toDateString())) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          consecutive = false;
        }
      }
    }
    
    return { total: revisionSessions.length, completed, upcoming, streak };
  }, [revisionSessions]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    refetchSchedules();
  };
  // --- End Revision Planner Data ---

  // Update course name when selection changes
  useEffect(() => {
    if (selectedCourseId) {
      supabase
        .from('courses')
        .select('title')
        .eq('id', selectedCourseId)
        .single()
        .then(({ data }) => {
          if (data) setSelectedCourseName(data.title);
        });
    } else {
      setSelectedCourseName('');
    }
  }, [selectedCourseId]);

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access your assessment data</h1>
        </div>
      </div>
    );
  }

  const handleTopicClick = (topic: any) => {
    setSelectedTopic(topic);
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/learning-hub/lesson/${lessonId}`);
  };

  const handleGenerateMissingImprovements = async () => {
    setIsGeneratingImprovements(true);
    try {
      await topicPerformanceService.generateMissingImprovements();
      refetchTopics();
    } catch (error) {
      console.error('Failed to generate missing improvements:', error);
    } finally {
      setIsGeneratingImprovements(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Center</h1>
          <p className="text-gray-600 mt-1">
            {selectedCourseId 
              ? `Track your assessment performance for ${selectedCourseName}`
              : 'Select a course to view detailed assessment analytics'
            }
          </p>
        </div>
        <div className="ml-auto">
          <Button
            onClick={handleGenerateMissingImprovements}
            disabled={isGeneratingImprovements}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGeneratingImprovements ? 'animate-spin' : ''}`} />
            {isGeneratingImprovements ? 'Generating...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {/* Course Selection */}
      <CourseSelector 
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
      />

      {/* Working At Grade Card */}
      <CourseGradeCard 
        courseId={selectedCourseId}
        courseName={selectedCourseName}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="revision-schedule">Revision Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Assessment Progress Chart - course and user filtered */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Assessment Performance Over Time</CardTitle>
              <CardDescription>
                {selectedCourseId 
                  ? `Track your progress and improvement for ${selectedCourseName}`
                  : 'Select a course to see course-specific performance trends'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCourseId ? (
                <AssessmentProgressChart 
                  filters={{
                    ...assessmentFilters,
                    selectedSubjects: [] // Will be filtered by course in the component
                  }} 
                  userRole={userRole || 'student'} 
                />
              ) : (
                <div className="h-80 flex items-center justify-center bg-background-alt rounded-lg">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Performance Radar Chart */}
          {selectedCourseId ? (
            modulePerformanceLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Module Performance Overview</CardTitle>
                  <CardDescription>Calculating performance...</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading module performance data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ModulePerformanceRadarChart 
                data={modulePerformance || []} 
                courseName={selectedCourseName} 
              />
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Module Performance Overview</CardTitle>
                <CardDescription>Select a course to see a breakdown of your module performance.</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <div className="h-full flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Topic Performance Summary */}
          {worstTopics && worstTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Areas Needing Attention</CardTitle>
                <CardDescription>
                  Topics with the highest error rates in {selectedCourseName || 'the selected course'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {worstTopics.slice(0, 3).map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <span className="font-medium text-red-900">{topic.topic}</span>
                        <p className="text-sm text-red-700">
                          {Math.round(topic.errorRate)}% error rate • {topic.subject}
                        </p>
                      </div>
                      <div className="text-sm text-red-600">
                        {topic.correctAnswers}/{topic.totalQuestions} correct
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revision-schedule" className="space-y-6">
          {showSetupWizard ? (
            <RevisionSetupWizard
              onComplete={handleSetupComplete}
              onCancel={() => setShowSetupWizard(false)}
              worstTopics={allWorstTopics}
              worstTopicsLoading={allWorstTopicsLoading}
            />
          ) : !activeSchedule ? (
            <div className="text-center py-12">
              <Card>
                <CardContent className="p-8">
                  <div className="max-w-md mx-auto">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Revision Schedule</h3>
                    <p className="text-gray-600 mb-8">
                      Create a personalized revision schedule based on your performance to stay on track.
                    </p>
                    <Button onClick={() => setShowSetupWizard(true)} size="lg">
                      <Target className="h-4 w-4 mr-2" />
                      Create Your Smart Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="h-5 w-5 text-blue-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{revisionStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg"><Target className="h-5 w-5 text-green-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{revisionStats.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg"><Clock className="h-5 w-5 text-orange-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Upcoming</p>
                        <p className="text-2xl font-bold text-gray-900">{revisionStats.upcoming}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Day Streak</p>
                        <p className="text-2xl font-bold text-gray-900">{revisionStats.streak}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Schedule Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{activeSchedule.name}</span>
                    <Badge variant="default">{activeSchedule.status}</Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{activeSchedule.selected_days.length} days/week</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{activeSchedule.weekly_hours} hours/week</span></div>
                      <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><span>Started {new Date(activeSchedule.start_date).toLocaleDateString()}</span></div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RevisionCalendar />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningHubAssessments;
