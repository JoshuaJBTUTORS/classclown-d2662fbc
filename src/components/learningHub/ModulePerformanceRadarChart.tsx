
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModulePerformanceData } from '@/services/topicPerformanceService';
import { Brain } from 'lucide-react';

interface ModulePerformanceRadarChartProps {
  data: ModulePerformanceData[];
  courseName: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg text-sm">
        <p className="font-bold mb-1">{data.module}</p>
        <p className="text-primary">{`Performance: ${data.performance}%`}</p>
        {data.totalQuestions > 0 && (
          <p className="text-muted-foreground text-xs">{`(${data.correctAnswers}/${data.totalQuestions} questions correct)`}</p>
        )}
      </div>
    );
  }
  return null;
};

const ModulePerformanceRadarChart: React.FC<ModulePerformanceRadarChartProps> = ({ data, courseName }) => {
  const chartData = data.map(item => ({
    module: item.module,
    performance: item.performance,
    fullMark: 100,
    totalQuestions: item.totalQuestions,
    correctAnswers: item.correctAnswers,
  }));
  
  const hasPerformanceData = chartData.some(d => d.performance > 0);

  if (!hasPerformanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Module Performance Overview</CardTitle>
          <CardDescription>Performance across modules in {courseName || 'the selected course'}</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-600">
                Complete some assessments to see your module performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Module Performance Overview</CardTitle>
        <CardDescription>Your performance across modules in {courseName}. This helps identify strengths and weaknesses.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="module" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Radar name="Performance" dataKey="performance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ModulePerformanceRadarChart;
