import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProgressSummaryProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
    selectedChild: string;
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
  const { user, parentProfile } = useAuth();

  useEffect(() => {
    fetchSummaryStats();
  }, [filters, user, userRole, parentProfile]);

  const fetchSummaryStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get student ID for student role
      let studentId = null;
      let studentIds: number[] = [];

      if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        studentId = studentData?.id;
        if (studentId) studentIds = [studentId];
      }

      // Get children IDs for parent role
      if (userRole === 'parent' && parentProfile) {
        const { data: childrenData } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', parentProfile.id);

        if (childrenData && childrenData.length > 0) {
          let allChildrenIds = childrenData.map(child => child.id);
          
          // If a specific child is selected, filter to just that child
          if (filters.selectedChild !== 'all') {
            const selectedChildId = parseInt(filters.selectedChild);
            studentIds = allChildrenIds.filter(id => id === selectedChildId);
          } else {
            studentIds = allChildrenIds;
          }
        } else {
          // If no children found, set empty stats
          setStats({
            averageScore: 0,
            attendanceRate: 0,
            totalHomework: 0,
            improvementTrend: 0
          });
          setLoading(false);
          return;
        }
      }

      // Fetch homework statistics
      let homeworkQuery = supabase
        .from('homework_submissions')
        .select('percentage_score, submitted_at')
        .not('percentage_score', 'is', null)
        .order('submitted_at', { ascending: true });

      if (userRole === 'student' && studentId) {
        homeworkQuery = homeworkQuery.eq('student_id', studentId);
      } else if (userRole === 'parent' && studentIds.length > 0) {
        homeworkQuery = homeworkQuery.in('student_id', studentIds);
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
      } else if (userRole === 'parent' && studentIds.length > 0) {
        attendanceQuery = attendanceQuery.in('student_id', studentIds);
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Average Score",
      value: `${stats.averageScore}%`,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Homework",
      value: stats.totalHomework.toString(),
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Improvement",
      value: `${stats.improvementTrend > 0 ? '+' : ''}${stats.improvementTrend}%`,
      icon: stats.improvementTrend >= 0 ? TrendingUp : TrendingDown,
      color: stats.improvementTrend >= 0 ? "text-green-600" : "text-red-600",
      bgColor: stats.improvementTrend >= 0 ? "bg-green-50" : "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <Card key={index} className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                  {card.title}
                </p>
                <p className="text-2xl font-bold font-playfair text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProgressSummary;
