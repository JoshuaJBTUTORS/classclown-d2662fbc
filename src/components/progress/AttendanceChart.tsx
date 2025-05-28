import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface AttendanceChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface AttendanceData {
  week: string;
  attended: number;
  total: number;
  percentage: number;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ filters, userRole }) => {
  const [data, setData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAttendanceData();
  }, [filters, user, userRole]);

  const fetchAttendanceData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('lesson_attendance')
        .select(`
          attendance_status,
          lesson:lessons(
            start_time,
            subject,
            title
          ),
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .order('lesson(start_time)', { ascending: true });

      // Filter by student for student role
      if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (studentData) {
          query = query.eq('student_id', studentData.id);
        }
      }

      // Apply owner filters
      if (userRole === 'owner') {
        if (filters.selectedStudents.length > 0) {
          query = query.in('student_id', filters.selectedStudents.map(id => parseInt(id)));
        }
      }

      const { data: attendance, error } = await query;

      if (error) throw error;

      // Group by week and calculate attendance percentages
      const weeklyData = new Map<string, { attended: number; total: number }>();

      attendance?.forEach(record => {
        const lessonDate = parseISO(record.lesson.start_time);
        
        // Apply date range filter
        if (filters.dateRange.from && lessonDate < filters.dateRange.from) return;
        if (filters.dateRange.to && lessonDate > filters.dateRange.to) return;

        // Apply subject filter
        if (filters.selectedSubjects.length > 0 && 
            !filters.selectedSubjects.includes(record.lesson.subject || 'General')) return;

        const weekStart = startOfWeek(lessonDate);
        const weekKey = format(weekStart, 'MMM dd');

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, { attended: 0, total: 0 });
        }

        const weekData = weeklyData.get(weekKey)!;
        weekData.total++;
        
        if (record.attendance_status === 'present') {
          weekData.attended++;
        }
      });

      const chartData: AttendanceData[] = Array.from(weeklyData.entries()).map(([week, data]) => ({
        week,
        attended: data.attended,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg border-l-4 border-l-green-500">
          <p className="font-semibold text-gray-900 mb-2">Week of {label}</p>
          <p className="text-green-600 font-medium">Attended: {data.attended}/{data.total}</p>
          <p className="text-blue-600 font-medium">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900">Attendance Tracking</CardTitle>
          <CardDescription className="text-gray-600">Loading attendance data...</CardDescription>
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
        <CardTitle className="font-playfair text-xl text-gray-900">Attendance Tracking</CardTitle>
        <CardDescription className="text-gray-600">
          {userRole === 'owner' ? 'Student attendance rates by week' : 'Your attendance rates by week'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="week" 
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
                <Bar 
                  dataKey="percentage" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-400">No attendance data available</p>
                <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
