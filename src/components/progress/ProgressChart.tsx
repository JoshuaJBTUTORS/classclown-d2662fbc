import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';

interface ProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface HomeworkScore {
  date: string;
  percentage: number;
  subject: string;
  homework_title: string;
  student_name?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ filters, userRole }) => {
  const { data: heycleo, isLoading: loading } = useHeyCleoProgress(filters.selectedStudents);

  const nameByHeycleoId = useMemo(() => {
    const map = new Map<string, string>();
    heycleo.students.forEach((s) => {
      if (s.heycleoStudentId) map.set(s.heycleoStudentId, s.name);
    });
    return map;
  }, [heycleo.students]);

  const data = useMemo<HomeworkScore[]>(() => {
    const from = filters.dateRange.from?.getTime();
    const to = filters.dateRange.to?.getTime();

    return heycleo.homework
      .filter((hw) => hw.percentage != null)
      .map((hw) => {
        const raw = hw.submitted_at ?? hw.due_date ?? hw.assigned_at;
        return { hw, time: raw ? new Date(raw).getTime() : NaN, raw };
      })
      .filter(({ time }) => !Number.isNaN(time))
      .filter(({ time }) => (from ? time >= from : true) && (to ? time <= to : true))
      .sort((a, b) => a.time - b.time)
      .map(({ hw, raw }) => ({
        date: format(parseISO(raw as string), 'MMM dd'),
        percentage: Math.round(Number(hw.percentage)),
        subject: hw.subject || 'General',
        homework_title: hw.title || 'Homework',
        student_name:
          heycleo.students.length > 1 && hw.student_id
            ? nameByHeycleoId.get(hw.student_id)
            : undefined,
      }))
      .filter((item) =>
        filters.selectedSubjects.length > 0 ? filters.selectedSubjects.includes(item.subject) : true,
      );
  }, [heycleo, filters.dateRange.from, filters.dateRange.to, filters.selectedSubjects, nameByHeycleoId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg border-l-4 border-l-[#e94b7f]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-[#e94b7f] font-medium">Score: {data.percentage}%</p>
          <p className="text-sm text-gray-600 mt-1">Subject: {data.subject}</p>
          <p className="text-sm text-gray-600">{data.homework_title}</p>
          {data.student_name && (
            <p className="text-sm text-gray-600">Student: {data.student_name}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900">Homework Progress</CardTitle>
          <CardDescription className="text-gray-600">Loading homework scores...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e94b7f]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="font-playfair text-xl text-gray-900">Homework Progress</CardTitle>
        <CardDescription className="text-gray-600">
          {userRole === 'owner' ? 'Student homework scores over time' : 
           'Your homework scores over time'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#e94b7f" 
                  strokeWidth={3}
                  dot={{ fill: '#e94b7f', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#e94b7f', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-400">No homework data available</p>
                <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
