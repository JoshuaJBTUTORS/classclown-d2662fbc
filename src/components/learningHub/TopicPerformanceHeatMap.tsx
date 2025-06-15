
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Cell, ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, BookOpen, Play } from 'lucide-react';

export interface TopicPerformanceData {
  topic: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  errorRate: number;
  confidenceScore: number;
  assessmentCount: number;
  lastAttempt: string;
  recommendedLessons: Array<{
    id: string;
    title: string;
    type: 'video' | 'text';
  }>;
}

interface TopicPerformanceHeatMapProps {
  data: TopicPerformanceData[];
  onTopicClick?: (topic: TopicPerformanceData) => void;
  onLessonClick?: (lessonId: string) => void;
}

const TopicPerformanceHeatMap: React.FC<TopicPerformanceHeatMapProps> = ({
  data,
  onTopicClick,
  onLessonClick
}) => {
  // Transform data for treemap visualization
  const treeMapData = data.map(topic => ({
    name: topic.topic,
    size: topic.totalQuestions,
    errorRate: topic.errorRate,
    confidenceScore: topic.confidenceScore,
    subject: topic.subject,
    data: topic
  }));

  // Color function based on error rate
  const getColor = (errorRate: number) => {
    if (errorRate >= 60) return '#dc2626'; // Red - needs significant improvement
    if (errorRate >= 40) return '#ea580c'; // Orange - needs improvement
    if (errorRate >= 25) return '#d97706'; // Amber - needs some work
    if (errorRate >= 10) return '#65a30d'; // Lime - good performance
    return '#16a34a'; // Green - excellent performance
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload.data;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-sm">
          <h4 className="font-semibold text-gray-900 mb-2">{data.topic}</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Subject:</span> {data.subject}</p>
            <p><span className="font-medium">Error Rate:</span> {Math.round(data.errorRate)}%</p>
            <p><span className="font-medium">Questions:</span> {data.correctAnswers}/{data.totalQuestions}</p>
            <p><span className="font-medium">Confidence:</span> {Math.round(data.confidenceScore)}/10</p>
            <p><span className="font-medium">Assessments:</span> {data.assessmentCount}</p>
          </div>
          {data.recommendedLessons.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Recommended:</p>
              <div className="flex flex-wrap gap-1">
                {data.recommendedLessons.slice(0, 2).map((lesson: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {lesson.type === 'video' ? '🎥' : '📖'} {lesson.title.slice(0, 20)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Group topics by subject for better organization
  const topicsBySubject = data.reduce((acc, topic) => {
    if (!acc[topic.subject]) acc[topic.subject] = [];
    acc[topic.subject].push(topic);
    return acc;
  }, {} as Record<string, TopicPerformanceData[]>);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Topic Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Yet</h3>
            <p className="text-gray-600">Complete some assessments to see your topic performance analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heat Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Topic Performance Heat Map
          </CardTitle>
          <p className="text-sm text-gray-600">
            Visual overview of your performance across different topics. Larger tiles = more questions, 
            redder colors = higher error rates.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ChartContainer
              config={{
                performance: {
                  label: "Performance",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treeMapData}
                  dataKey="size"
                  aspectRatio={4/3}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {treeMapData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColor(entry.errorRate)}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onTopicClick?.(entry.data)}
                    />
                  ))}
                  <Tooltip content={<CustomTooltip />} />
                </Treemap>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Excellent (&lt;10% errors)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-lime-600 rounded"></div>
              <span>Good (10-25%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-600 rounded"></div>
              <span>Needs Work (25-40%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-600 rounded"></div>
              <span>Needs Improvement (40-60%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Critical (&gt;60%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Topic Breakdown by Subject */}
      <div className="grid gap-4">
        {Object.entries(topicsBySubject).map(([subject, topics]) => (
          <Card key={subject}>
            <CardHeader>
              <CardTitle className="text-lg">{subject} - Topic Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {topics
                  .sort((a, b) => b.errorRate - a.errorRate)
                  .slice(0, 5)
                  .map((topic, index) => (
                    <div 
                      key={topic.topic}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onTopicClick?.(topic)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{topic.topic}</span>
                          <Badge 
                            variant={topic.errorRate > 40 ? "destructive" : topic.errorRate > 25 ? "outline" : "default"}
                            className="text-xs"
                          >
                            {Math.round(topic.errorRate)}% errors
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {topic.correctAnswers}/{topic.totalQuestions} correct • 
                          Confidence: {Math.round(topic.confidenceScore)}/10 • 
                          {topic.assessmentCount} assessment{topic.assessmentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {topic.recommendedLessons.length > 0 && (
                        <div className="flex gap-2">
                          {topic.recommendedLessons.slice(0, 2).map((lesson, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLessonClick?.(lesson.id);
                              }}
                              className="text-xs"
                            >
                              {lesson.type === 'video' ? (
                                <Play className="h-3 w-3 mr-1" />
                              ) : (
                                <BookOpen className="h-3 w-3 mr-1" />
                              )}
                              Review
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopicPerformanceHeatMap;
