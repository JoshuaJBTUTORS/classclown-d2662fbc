
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

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
  const [data, setData] = useState<HomeworkScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchHomeworkProgress();
  }, [filters, user, userRole]);

  const fetchHomeworkProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('homework_submissions')
        .select(`
          percentage_score,
          submitted_at,
          homework:homework(
            title,
            lesson:lessons(
              subject,
              title
            )
          ),
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .not('percentage_score', 'is', null)
        .order('submitted_at', { ascending: true });

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

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('submitted_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('submitted_at', filters.dateRange.to.toISOString());
      }

      const { data: submissions, error } = await query;

      if (error) throw error;

      const chartData = submissions?.map(submission => ({
        date: format(parseISO(submission.submitted_at), 'MMM dd'),
        percentage: submission.percentage_score,
        subject: submission.homework.lesson.subject || 'General',
        homework_title: submission.homework.title,
        student_name: userRole === 'owner' 
          ? `${submission.student.first_name} ${submission.student.last_name}`
          : undefined
      })) || [];

      // Filter by subject if specified
      const filteredData = filters.selectedSubjects.length > 0
        ? chartData.filter(item => filters.selectedSubjects.includes(item.subject))
        : chartData;

      setData(filteredData);
    } catch (error) {
      console.error('Error fetching homework progress:', error);
      toast.error('Failed to load homework progress');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">Score: {data.percentage}%</p>
          <p className="text-sm text-gray-600">Subject: {data.subject}</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Homework Progress</CardTitle>
          <CardDescription>Loading homework scores...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homework Progress</CardTitle>
        <CardDescription>
          {userRole === 'owner' ? 'Student homework scores over time' : 'Your homework scores over time'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No homework data available for the selected filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
