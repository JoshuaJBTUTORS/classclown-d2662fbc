
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProgressSummaryProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface SummaryStats {
  averageScore: number;
  attendanceRate: number;
  totalHomework: number;
  improvementTrend: number;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ filters, userRole }) => {
  const [stats, setStats] = useState<SummaryStats>({
    averageScore: 0,
    attendanceRate: 0,
    totalHomework: 0,
    improvementTrend: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSummaryStats();
  }, [filters, user, userRole]);

  const fetchSummaryStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get student ID for student role
      let studentId = null;
      if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        studentId = studentData?.id;
      }

      // Fetch homework statistics
      let homeworkQuery = supabase
        .from('homework_submissions')
        .select('percentage_score, submitted_at')
        .not('percentage_score', 'is', null)
        .order('submitted_at', { ascending: true });

      if (userRole === 'student' && studentId) {
        homeworkQuery = homeworkQuery.eq('student_id', studentId);
      } else if (userRole === 'owner' && filters.selectedStudents.length > 0) {
        homeworkQuery = homeworkQuery.in('student_id', filters.selectedStudents.map(id => parseInt(id)));
      }

      if (filters.dateRange.from) {
        homeworkQuery = homeworkQuery.gte('submitted_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        homeworkQuery = homeworkQuery.lte('submitted_at', filters.dateRange.to.toISOString());
      }

      const { data: homeworkData, error: homeworkError } = await homeworkQuery;
      if (homeworkError) throw homeworkError;

      // Fetch attendance statistics
      let attendanceQuery = supabase
        .from('lesson_attendance')
        .select(`
          attendance_status,
          lesson:lessons(start_time, subject)
        `);

      if (userRole === 'student' && studentId) {
        attendanceQuery = attendanceQuery.eq('student_id', studentId);
      } else if (userRole === 'owner' && filters.selectedStudents.length > 0) {
        attendanceQuery = attendanceQuery.in('student_id', filters.selectedStudents.map(id => parseInt(id)));
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Calculate statistics
      const totalHomework = homeworkData?.length || 0;
      const averageScore = totalHomework > 0 
        ? Math.round(homeworkData!.reduce((sum, hw) => sum + hw.percentage_score, 0) / totalHomework)
        : 0;

      const totalLessons = attendanceData?.length || 0;
      const attendedLessons = attendanceData?.filter(a => a.attendance_status === 'present').length || 0;
      const attendanceRate = totalLessons > 0 
        ? Math.round((attendedLessons / totalLessons) * 100)
        : 0;

      // Calculate improvement trend (comparing first half vs second half of data)
      let improvementTrend = 0;
      if (homeworkData && homeworkData.length >= 4) {
        const midpoint = Math.floor(homeworkData.length / 2);
        const firstHalf = homeworkData.slice(0, midpoint);
        const secondHalf = homeworkData.slice(midpoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, hw) => sum + hw.percentage_score, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, hw) => sum + hw.percentage_score, 0) / secondHalf.length;
        
        improvementTrend = Math.round(secondHalfAvg - firstHalfAvg);
      }

      setStats({
        averageScore,
        attendanceRate,
        totalHomework,
        improvementTrend
      });
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      toast.error('Failed to load progress summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Attendance Rate</p>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Total Homework</p>
              <p className="text-2xl font-bold">{stats.totalHomework}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            {stats.improvementTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Improvement</p>
              <p className={`text-2xl font-bold ${stats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressSummary;
