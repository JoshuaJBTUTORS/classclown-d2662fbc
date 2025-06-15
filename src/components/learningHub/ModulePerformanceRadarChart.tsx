
import * as React from 'react';
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModulePerformanceData } from '@/services/topicPerformanceService';
import { Brain, Star } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';

interface ModulePerformanceRadarChartProps {
  data: ModulePerformanceData[];
  courseName: string;
}

const chartConfig = {
  performance: {
    label: "Performance",
    color: "hsl(var(--chart-2))",
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.isAssessed) {
      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-sm animate-fade-in">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-muted-foreground">Assessment not completed yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Complete an assessment to unlock your score!</p>
        </div>
      );
    }

    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg text-sm animate-fade-in">
        <p className="font-bold mb-1 flex items-center gap-2">
          {label}
          {data.performance >= 85 && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
        </p>
        <p style={{ color: chartConfig.performance.color }}>{`Performance: ${data.performance}%`}</p>
        {data.totalMarks > 0 && (
          <p className="text-muted-foreground text-xs">{`(${data.achievedMarks}/${data.totalMarks} marks)`}</p>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.isAssessed) {
    let r = 4;
    let color = chartConfig.performance.color;
    if (payload.performance >= 85) {
      r = 6;
      color = 'hsl(var(--chart-5))';
    } else if (payload.performance >= 60) {
      color = 'hsl(var(--chart-4))';
    }
    return <circle cx={cx} cy={cy} r={r} fill={color} stroke={color} strokeWidth={1} />;
  }

  // Pulsing dot for unassessed modules
  return (
    <g>
      <style>{`
          @keyframes pulse-dot {
              0%, 100% { r: 4px; opacity: 0.5; }
              50% { r: 6px; opacity: 0.8; }
          }
          .pulsing-dot-anim { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>
      <circle className="pulsing-dot-anim" cx={cx} cy={cy} fill="hsl(var(--muted-foreground))" />
    </g>
  );
};

const ModulePerformanceRadarChart: React.FC<ModulePerformanceRadarChartProps> = ({ data, courseName }) => {
  const chartData = data.map(item => ({
    ...item,
    module: item.module,
    performance: item.performance,
    fullMark: 100,
  }));
  
  const hasAnyAssessedData = chartData.some(d => d.isAssessed);

  if (!hasAnyAssessedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Quest Awaits!</CardTitle>
          <CardDescription>Performance across modules in {courseName || 'the selected course'}</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/30">
            <div className="text-center">
              <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Performance Data Yet</h3>
              <p className="text-muted-foreground">
                Complete your first assessment to begin your journey!
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
        <CardTitle className="text-xl">Module Mastery Map</CardTitle>
        <CardDescription>Your performance across modules in {courseName}. This helps identify strengths and areas to conquer.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 h-96">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
          <RadarChart data={chartData}>
            <defs>
              <radialGradient id="performance-gradient">
                <stop offset="0%" stopColor={chartConfig.performance.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartConfig.performance.color} stopOpacity={0.1} />
              </radialGradient>
            </defs>
            <PolarGrid gridType="circle" className="stroke-muted-foreground/30" />
            <PolarAngleAxis dataKey="module" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Radar
              name="Performance"
              dataKey="performance"
              stroke={chartConfig.performance.color}
              fill="url(#performance-gradient)"
              strokeWidth={2}
              dot={<CustomDot />}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--chart-1))", fillOpacity: 0.1 }}
            />
            <Legend />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ModulePerformanceRadarChart;
