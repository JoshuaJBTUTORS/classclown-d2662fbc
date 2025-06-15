import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Award, BookOpen, RefreshCw } from 'lucide-react';
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

const LearningHubAssessments = () => {
  const { userRole, user } = useAuth();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [isGeneratingImprovements, setIsGeneratingImprovements] = useState(false);

  const assessmentFilters = {
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  };

  // Get course-specific stats
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

      // Get assessment sessions for this course
      const { data: sessions } = await supabase
        .from('assessment_sessions')
        .select(`
          total_marks_achieved,
          total_marks_available,
          completed_at,
          ai_assessments(subject)
        `)
        .eq('user_id', user.id)
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
    enabled: !!user && !!selectedCourseId,
  });

  // Default stats for when no course is selected
  const defaultStats = {
    totalAssessments: 0,
    averageScore: 0,
    improvementRate: 0,
    completionRate: 0
  };

  const stats = courseStats || defaultStats;

  // Get topic performance data for selected course
  const { data: topicPerformance, isLoading: topicLoading, refetch: refetchTopics } = useQuery({
    queryKey: ['topic-performance', selectedCourseId],
    queryFn: () => topicPerformanceService.getUserTopicPerformance(selectedCourseId || undefined),
  });

  // Get module performance for radar chart
  const { data: modulePerformance, isLoading: modulePerformanceLoading } = useQuery({
    queryKey: ['module-performance', selectedCourseId],
    queryFn: () => topicPerformanceService.getCourseModulePerformance(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  // Get worst performing topics for improvement section
  const { data: worstTopics } = useQuery({
    queryKey: ['worst-topics', selectedCourseId],
    queryFn: () => topicPerformanceService.getWorstPerformingTopics(5, selectedCourseId || undefined),
  });

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
          <TabsTrigger value="improvements">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Assessment Progress Chart - course filtered */}
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
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                    <p className="text-gray-600">
                      Choose a course above to see your assessment performance over time.
                    </p>
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
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                    <p className="text-gray-600">
                      Choose a course above to see your module performance radar chart.
                    </p>
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

        <TabsContent value="topics" className="space-y-6">
          {/* Topic Performance Heat Map - course filtered */}
          {topicLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading topic performance data...</p>
                </div>
              </CardContent>
            </Card>
          ) : selectedCourseId ? (
            <TopicPerformanceHeatMap
              data={topicPerformance || []}
              onTopicClick={handleTopicClick}
              onLessonClick={handleLessonClick}
            />
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                  <p className="text-gray-600">
                    Choose a course above to see detailed topic performance analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-6">
          {/* Improvement Recommendations */}
          {selectedTopic ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Focused Recommendations for {selectedTopic.topic}</CardTitle>
                <CardDescription>
                  Specific lessons and resources to improve your performance in this topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* ... keep existing code (focused recommendations display) the same ... */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{Math.round(selectedTopic.errorRate)}%</p>
                      <p className="text-sm text-red-700">Error Rate</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedTopic.correctAnswers}/{selectedTopic.totalQuestions}</p>
                      <p className="text-sm text-blue-700">Questions Correct</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{Math.round(selectedTopic.confidenceScore)}/10</p>
                      <p className="text-sm text-green-700">Confidence</p>
                    </div>
                  </div>

                  {selectedTopic.recommendedLessons.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Recommended Resources:</h4>
                      {selectedTopic.recommendedLessons.map((lesson: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {lesson.type === 'video' ? (
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <BookOpen className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                          <button
                            onClick={() => handleLessonClick(lesson.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                          >
                            Study Now
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No specific lesson recommendations available for this topic yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Assessment Improvement Recommendations</CardTitle>
                <CardDescription>
                  {selectedCourseId 
                    ? `Click on a topic in the Topic Analysis tab to see specific recommendations for ${selectedCourseName}`
                    : 'Select a course and click on a topic to see personalized study recommendations'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedCourseId ? 'Select a Topic for Recommendations' : 'Choose a Course and Topic'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedCourseId 
                      ? 'Go to the Topic Analysis tab and click on any topic to see personalized study recommendations'
                      : 'First select a course above, then go to Topic Analysis to see recommendations'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningHubAssessments;
