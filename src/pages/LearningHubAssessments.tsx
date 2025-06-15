
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Target, Award } from 'lucide-react';
import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';
import { useAuth } from '@/contexts/AuthContext';

const LearningHubAssessments = () => {
  const { userRole } = useAuth();

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

      {/* Assessment Progress Chart */}
      <div className="grid grid-cols-1 gap-6">
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
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Assessments</CardTitle>
          <CardDescription>
            Your latest assessment attempts and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent assessments</h3>
            <p className="text-gray-600">Complete assessments in your courses to see them here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningHubAssessments;
