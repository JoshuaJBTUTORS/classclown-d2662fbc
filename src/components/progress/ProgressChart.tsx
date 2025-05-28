import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

interface ProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
    selectedChild: string;
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
  const { user, parentProfile } = useAuth();

  useEffect(() => {
    fetchHomeworkProgress();
  }, [filters, user, userRole, parentProfile]);

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

      // Filter by parent's children for parent role
      if (userRole === 'parent' && parentProfile) {
        const { data: childrenData } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', parentProfile.id);

        if (childrenData && childrenData.length > 0) {
          let childrenIds = childrenData.map(child => child.id);
          
          // If a specific child is selected, filter to just that child
          if (filters.selectedChild !== 'all') {
            const selectedChildId = parseInt(filters.selectedChild);
            childrenIds = childrenIds.filter(id => id === selectedChildId);
          }
          
          if (childrenIds.length > 0) {
            query = query.in('student_id', childrenIds);
          } else {
            setData([]);
            setLoading(false);
            return;
          }
        } else {
          // If no children found, return empty data
          setData([]);
          setLoading(false);
          return;
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
           userRole === 'parent' ? 'Your children\'s homework scores over time' :
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
