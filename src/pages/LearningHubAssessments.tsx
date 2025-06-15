
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Award, BookOpen } from 'lucide-react';
import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';
import TopicPerformanceHeatMap from '@/components/learningHub/TopicPerformanceHeatMap';
import AssessmentImprovementDashboard from '@/components/learningHub/AssessmentImprovementDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { topicPerformanceService } from '@/services/topicPerformanceService';
import { useNavigate } from 'react-router-dom';

const LearningHubAssessments = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const assessmentFilters = {
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  };

  // Mock stats - these could be calculated from actual assessment data
  const stats = {
    totalAssessments: 12,
    averageScore: 78,
    improvementRate: 15,
    completionRate: 89
  };

  // Get topic performance data
  const { data: topicPerformance, isLoading: topicLoading } = useQuery({
    queryKey: ['topic-performance'],
    queryFn: topicPerformanceService.getUserTopicPerformance,
  });

  // Get worst performing topics for improvement section
  const { data: worstTopics } = useQuery({
    queryKey: ['worst-topics'],
    queryFn: () => topicPerformanceService.getWorstPerformingTopics(5),
  });

  const handleTopicClick = (topic: any) => {
    setSelectedTopic(topic);
  };

  const handleLessonClick = (lessonId: string) => {
    // Navigate to the specific lesson
    navigate(`/learning-hub/lesson/${lessonId}`);
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
          <p className="text-gray-600 mt-1">Track your assessment performance and progress</p>
        </div>
      </div>

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
                <p className="text-2xl font-bold text-gray-900">+{stats.improvementRate}%</p>
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
          {/* Assessment Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Assessment Performance Over Time</CardTitle>
              <CardDescription>
                Track your progress and improvement across all assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentProgressChart 
                filters={assessmentFilters} 
                userRole={userRole || 'student'} 
              />
            </CardContent>
          </Card>

          {/* Quick Topic Performance Summary */}
          {worstTopics && worstTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Areas Needing Attention</CardTitle>
                <CardDescription>
                  Topics with the highest error rates that could benefit from additional study
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
          {/* Topic Performance Heat Map */}
          {topicLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading topic performance data...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TopicPerformanceHeatMap
              data={topicPerformance || []}
              onTopicClick={handleTopicClick}
              onLessonClick={handleLessonClick}
            />
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
                  Click on a topic in the Topic Analysis tab to see specific recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Topic for Recommendations</h3>
                  <p className="text-gray-600">
                    Go to the Topic Analysis tab and click on any topic to see personalized study recommendations
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
