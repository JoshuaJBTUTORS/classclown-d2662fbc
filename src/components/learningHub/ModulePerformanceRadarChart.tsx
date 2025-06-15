
import * as React from 'react';
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModulePerformanceData } from '@/services/topicPerformanceService';
import { Brain, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';

interface ModulePerformanceRadarChartProps {
  data: ModulePerformanceData[];
  courseName: string;
}

const chartConfig = {
  performance: {
    label: "Performance",
    color: "hsl(var(--chart-1))",
  },
};

const getPerformanceTier = (score: number) => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

const performanceColors = {
  high: 'hsl(var(--performance-high))',
  medium: 'hsl(var(--performance-medium))',
  low: 'hsl(var(--performance-low))',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    let icon;
    if (data.performance >= 75) icon = <TrendingUp className="w-4 h-4 text-performance-high" />;
    else if (data.performance >= 50) icon = <Minus className="w-4 h-4 text-performance-medium" />;
    else icon = <TrendingDown className="w-4 h-4 text-performance-low" />;
    
    if (!data.isAssessed) {
      return (
        <div className="p-3 bg-background border rounded-lg shadow-xl text-sm animate-fade-in">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-muted-foreground">Assessment not completed yet.</p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-background border rounded-lg shadow-xl text-sm animate-fade-in space-y-1">
        <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2">
              {label}
              {data.performance >= 85 && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
            </p>
            {icon}
        </div>
        <p style={{ color: performanceColors[getPerformanceTier(data.performance)] }}>{`Performance: ${data.performance}%`}</p>
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
    const tier = getPerformanceTier(payload.performance);
    const color = performanceColors[tier];
    let r = 5;

    if (payload.performance >= 85) r = 7;
    
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={color} stroke={"hsl(var(--background))"} strokeWidth={2} />
        {payload.performance >= 85 && 
            <circle cx={cx} cy={cy} r={r} fill={color} stroke={color} strokeWidth={2} className="opacity-50 animate-pulse" />
        }
      </g>
    );
  }

  // Pulsing dot for unassessed modules
  return (
    <g>
      <style>{`
          @keyframes pulse-dot {
              0%, 100% { r: 4px; opacity: 0.5; }
              50% { r: 7px; opacity: 0.9; }
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
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Your Quest Awaits!</CardTitle>
          <CardDescription>Performance across modules in {courseName || 'the selected course'}</CardDescription>
        </CardHeader>
        <CardContent className="h-96 p-0">
          <div className="h-full flex items-center justify-center rounded-lg">
            <div className="text-center p-4">
              <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Performance Data Yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Complete your first assessment to reveal your Module Mastery Map and start your journey!
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
              <radialGradient id="performance-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </radialGradient>
            </defs>
            <PolarGrid gridType="circle" className="stroke-border/80" />
            <PolarAngleAxis dataKey="module" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "transparent" }} axisLine={{ stroke: "transparent" }} />
            <Radar
              name="Performance"
              dataKey="performance"
              stroke="hsl(var(--primary))"
              fill="url(#performance-gradient)"
              strokeWidth={2}
              dot={<CustomDot />}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--primary))", fillOpacity: 0.1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ModulePerformanceRadarChart;
