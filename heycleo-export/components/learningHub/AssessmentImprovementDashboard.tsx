
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlayCircle, TrendingDown, Target, ArrowRight } from 'lucide-react';
import { assessmentImprovementService, WeakTopic, RecommendedLesson } from '@/services/assessmentImprovementService';

interface AssessmentImprovementDashboardProps {
  sessionId: string;
  onLessonClick?: (lessonId: string) => void;
}

const AssessmentImprovementDashboard: React.FC<AssessmentImprovementDashboardProps> = ({
  sessionId,
  onLessonClick
}) => {
  const { data: improvements, isLoading } = useQuery({
    queryKey: ['assessment-improvements', sessionId],
    queryFn: async () => {
      const existing = await assessmentImprovementService.getImprovements(sessionId);
      if (existing) return existing;
      
      // Generate improvements if they don't exist
      return await assessmentImprovementService.generateImprovements(sessionId);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!improvements || improvements.weak_topics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Target className="h-5 w-5" />
            Excellent Performance!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {improvements?.improvement_summary || "Great job! No significant areas for improvement identified."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const weakTopics = improvements.weak_topics as WeakTopic[];
  const recommendedLessons = improvements.recommended_lessons as RecommendedLesson[];

  return (
    <div className="space-y-6">
      {/* Improvement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalized Learning Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{improvements.improvement_summary}</p>
          
          {/* Weak Topics Overview */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              Topics to Focus On
            </h4>
            
            <div className="grid gap-3">
              {weakTopics.slice(0, 3).map((topic, index) => {
                const errorRate = (topic.questions_missed / topic.total_questions) * 100;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-orange-900 capitalize">{topic.topic}</span>
                        <Badge variant="outline" className="text-xs">
                          {topic.questions_missed}/{topic.total_questions} missed
                        </Badge>
                      </div>
                      <Progress value={100 - errorRate} className="h-2 mb-1" />
                      <p className="text-xs text-orange-700">
                        {Math.round(errorRate)}% error rate
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Lessons */}
      {recommendedLessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recommended Content to Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {recommendedLessons.map((lesson, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {lesson.content_type === 'video' ? (
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{lesson.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{lesson.module_title}</p>
                      
                      {lesson.topics_covered.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lesson.topics_covered.map((topic, topicIndex) => (
                            <Badge key={topicIndex} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLessonClick?.(lesson.lesson_id)}
                    className="shrink-0"
                  >
                    Review
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
            
            {recommendedLessons.length === 0 && (
              <p className="text-gray-600 text-center py-4">
                No specific lesson recommendations available at this time.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentImprovementDashboard;
