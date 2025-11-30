
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Award, Target, BarChart3 } from 'lucide-react';
import { courseGradeService, CourseGrade } from '@/services/courseGradeService';

interface CourseGradeCardProps {
  courseId: string | null;
  courseName?: string;
}

const CourseGradeCard: React.FC<CourseGradeCardProps> = ({ courseId, courseName }) => {
  const { data: gradeData, isLoading } = useQuery({
    queryKey: ['course-grade', courseId],
    queryFn: () => courseGradeService.calculateCourseGrade(courseId!),
    enabled: !!courseId,
  });

  if (!courseId) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-400" />
            Working At Grade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
            <p className="text-gray-600">
              Choose a course above to see your working at grade and detailed performance analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-400" />
            Working At Grade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gradeData) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-400" />
            Working At Grade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Data</h3>
            <p className="text-gray-600">
              Complete some assessments for this course to see your working at grade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return 'bg-green-500';
    if (grade >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { text: 'Improving', color: 'text-green-600' };
      case 'declining':
        return { text: 'Declining', color: 'text-red-600' };
      default:
        return { text: 'Stable', color: 'text-gray-600' };
    }
  };

  const trendInfo = getTrendText(gradeData.improvementTrend);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Working At Grade {courseName && `- ${courseName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Grade Display */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full ${getGradeColor(gradeData.workingAtGrade)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
              {gradeData.workingAtGrade}
            </div>
            <div className="absolute -bottom-2 -right-2">
              {getTrendIcon(gradeData.improvementTrend)}
            </div>
          </div>
        </div>

        {/* Grade Explanation */}
        <p className="text-center text-gray-700 mb-6 text-sm leading-relaxed">
          {gradeData.explanation}
        </p>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{gradeData.averageScore}%</div>
            <div className="text-xs text-blue-700">Average Score</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{gradeData.topicMastery}%</div>
            <div className="text-xs text-purple-700">Topic Mastery</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{gradeData.consistency}%</div>
            <div className="text-xs text-green-700">Consistency</div>
          </div>
        </div>

        {/* Trend Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className={`${trendInfo.color} border-current`}>
            <span className="flex items-center gap-1">
              {getTrendIcon(gradeData.improvementTrend)}
              {trendInfo.text}
            </span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseGradeCard;
