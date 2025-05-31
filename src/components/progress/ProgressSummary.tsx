import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookOpen, Clock, TrendingUp, Brain, Lock } from 'lucide-react';
import { UserRole } from '@/types/userRole';

interface ProgressSummaryProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
    selectedChild: string;
  };
  userRole: UserRole;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ filters, userRole }) => {
  const [homeworkAverage, setHomeworkAverage] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [improvementTrend, setImprovementTrend] = useState<number>(0);
  const [aiAssessmentAverage, setAiAssessmentAverage] = useState<number>(0);
  const [hasLockedContent, setHasLockedContent] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { user, parentProfile } = useAuth();

  useEffect(() => {
    fetchProgressSummary();
  }, [filters, user, userRole, parentProfile]);

  const fetchProgressSummary = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchHomeworkAverage(),
        fetchAttendanceRate(),
        fetchImprovementTrend(),
        fetchAIAssessmentAverage()
      ]);
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      toast.error('Failed to load progress summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeworkAverage = async () => {
    if (userRole === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData) {
        const { data: submissions } = await supabase
          .from('homework_submissions')
          .select('percentage_score, student:students(id, first_name, last_name)')
          .eq('student_id', studentData.id)
          .not('percentage_score', 'is', null);

        if (submissions && submissions.length > 0) {
          const average = submissions.reduce((sum, sub) => sum + sub.percentage_score, 0) / submissions.length;
          setHomeworkAverage(Math.round(average));
        } else {
          setHomeworkAverage(0);
        }
      }
      return;
    }

    if (userRole === 'parent' && parentProfile) {
      const { data: childrenData } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('parent_id', parentProfile.id);

      if (childrenData && childrenData.length > 0) {
        // Get student IDs for homework submissions (uses student_id, not user_id)
        let studentIds: number[] = [];
        
        if (filters.selectedChild !== 'all') {
          const selectedChildId = parseInt(filters.selectedChild);
          const selectedChild = childrenData.find(child => child.id === selectedChildId);
          if (selectedChild) {
            studentIds = [selectedChild.id];
          }
        } else {
          studentIds = childrenData.map(child => child.id);
        }

        if (studentIds.length > 0) {
          const { data: submissions } = await supabase
            .from('homework_submissions')
            .select('percentage_score, student:students(id, first_name, last_name)')
            .in('student_id', studentIds)
            .not('percentage_score', 'is', null);

          if (submissions && submissions.length > 0) {
            const average = submissions.reduce((sum, sub) => sum + sub.percentage_score, 0) / submissions.length;
            setHomeworkAverage(Math.round(average));
          } else {
            setHomeworkAverage(0);
          }
        } else {
          setHomeworkAverage(0);
        }
      }
      return;
    }

    if (userRole === 'owner' && filters.selectedStudents.length > 0) {
      const studentIds = filters.selectedStudents.map(id => parseInt(id));
      const { data: submissions } = await supabase
        .from('homework_submissions')
        .select('percentage_score, student:students(id, first_name, last_name)')
        .in('student_id', studentIds)
        .not('percentage_score', 'is', null);

      if (submissions && submissions.length > 0) {
        const average = submissions.reduce((sum, sub) => sum + sub.percentage_score, 0) / submissions.length;
        setHomeworkAverage(Math.round(average));
      } else {
        setHomeworkAverage(0);
      }
      return;
    }

    // Default case
    const { data: submissions } = await supabase
      .from('homework_submissions')
      .select('percentage_score, student:students(id, first_name, last_name)')
      .not('percentage_score', 'is', null);
    
    if (submissions && submissions.length > 0) {
      const average = submissions.reduce((sum, sub) => sum + sub.percentage_score, 0) / submissions.length;
      setHomeworkAverage(Math.round(average));
    } else {
      setHomeworkAverage(0);
    }
  };

  const fetchAttendanceRate = async () => {
    let query = supabase
      .from('lesson_attendance')
      .select('attendance_status, student:students(id, first_name, last_name)');

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

    const { data: attendance } = await query;
    
    if (attendance && attendance.length > 0) {
      const presentCount = attendance.filter(a => a.attendance_status === 'present').length;
      const rate = (presentCount / attendance.length) * 100;
      setAttendanceRate(Math.round(rate));
    } else {
      setAttendanceRate(0);
    }
  };

  const fetchImprovementTrend = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('homework_submissions')
      .select('percentage_score, submitted_at')
      .not('percentage_score', 'is', null)
      .gte('submitted_at', thirtyDaysAgo.toISOString())
      .order('submitted_at', { ascending: true });

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

    const { data: recentSubmissions } = await query;
    
    if (recentSubmissions && recentSubmissions.length >= 2) {
      const firstHalf = recentSubmissions.slice(0, Math.floor(recentSubmissions.length / 2));
      const secondHalf = recentSubmissions.slice(Math.floor(recentSubmissions.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, sub) => sum + sub.percentage_score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, sub) => sum + sub.percentage_score, 0) / secondHalf.length;
      
      setImprovementTrend(Math.round(secondAvg - firstAvg));
    } else {
      setImprovementTrend(0);
    }
  };

  const fetchAIAssessmentAverage = async () => {
    if (userRole === 'student') {
      const { data: sessions } = await supabase
        .from('assessment_sessions')
        .select(`
          total_marks_achieved,
          total_marks_available,
          user_id,
          student:students(id, first_name, last_name)
        `)
        .eq('status', 'completed')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (sessions && sessions.length > 0) {
        const validSessions = sessions.filter(s => s.total_marks_available > 0);
        if (validSessions.length > 0) {
          const totalPercentage = validSessions.reduce((sum, session) => {
            return sum + (session.total_marks_achieved / session.total_marks_available) * 100;
          }, 0);
          setAiAssessmentAverage(Math.round(totalPercentage / validSessions.length));
        } else {
          setAiAssessmentAverage(0);
        }
      } else {
        setAiAssessmentAverage(0);
      }
      setHasLockedContent(false);
      return;
    }

    if (userRole === 'parent' && parentProfile) {
      const { data: childrenData } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('parent_id', parentProfile.id);

      if (childrenData && childrenData.length > 0) {
        // Get user IDs for assessment sessions (uses user_id)
        let userIds: string[] = [];
        
        if (filters.selectedChild !== 'all') {
          const selectedChildId = parseInt(filters.selectedChild);
          const selectedChild = childrenData.find(child => child.id === selectedChildId);
          if (selectedChild?.user_id) {
            userIds = [selectedChild.user_id];
          }
        } else {
          userIds = childrenData
            .map(child => child.user_id)
            .filter((id): id is string => id !== null);
        }

        if (userIds.length > 0) {
          const { data: sessions } = await supabase
            .from('assessment_sessions')
            .select(`
              total_marks_achieved,
              total_marks_available,
              user_id,
              student:students(id, first_name, last_name)
            `)
            .eq('status', 'completed')
            .in('user_id', userIds)
            .not('completed_at', 'is', null);

          if (sessions && sessions.length > 0) {
            const hasLocked = userRole === 'parent';
            setHasLockedContent(hasLocked);

            const validSessions = sessions.filter(s => s.total_marks_available > 0);
            if (validSessions.length > 0) {
              const totalPercentage = validSessions.reduce((sum, session) => {
                return sum + (session.total_marks_achieved / session.total_marks_available) * 100;
              }, 0);
              setAiAssessmentAverage(Math.round(totalPercentage / validSessions.length));
            } else {
              setAiAssessmentAverage(0);
            }
          } else {
            setAiAssessmentAverage(0);
            setHasLockedContent(false);
          }
        } else {
          setAiAssessmentAverage(0);
          setHasLockedContent(false);
        }
      }
      return;
    }

    // Default case for owners and others
    const { data: sessions } = await supabase
      .from('assessment_sessions')
      .select(`
        total_marks_achieved,
        total_marks_available,
        user_id,
        student:students(id, first_name, last_name)
      `)
      .eq('status', 'completed')
      .not('completed_at', 'is', null);
    
    if (sessions && sessions.length > 0) {
      const hasLocked = userRole !== 'owner' && userRole !== 'admin';
      setHasLockedContent(hasLocked);

      const validSessions = sessions.filter(s => s.total_marks_available > 0);
      if (validSessions.length > 0) {
        const totalPercentage = validSessions.reduce((sum, session) => {
          return sum + (session.total_marks_achieved / session.total_marks_available) * 100;
        }, 0);
        setAiAssessmentAverage(Math.round(totalPercentage / validSessions.length));
      } else {
        setAiAssessmentAverage(0);
      }
    } else {
      setAiAssessmentAverage(0);
      setHasLockedContent(false);
    }
  };

  const cards = [
    {
      title: 'Homework Average',
      value: `${homeworkAverage}%`,
      icon: BookOpen,
      color: 'text-[#e94b7f]',
      bgColor: 'bg-[#e94b7f]/10'
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'AI Assessment Average',
      value: hasLockedContent ? (
        <div className="flex items-center gap-1">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Locked</span>
        </div>
      ) : `${aiAssessmentAverage}%`,
      icon: Brain,
      color: 'text-[#8b5cf6]',
      bgColor: 'bg-[#8b5cf6]/10'
    },
    {
      title: '30-Day Trend',
      value: improvementTrend > 0 ? `+${improvementTrend}%` : `${improvementTrend}%`,
      icon: TrendingUp,
      color: improvementTrend >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: improvementTrend >= 0 ? 'bg-green-100' : 'bg-red-100'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-200/50 bg-white shadow-sm">
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                <p className={`text-2xl font-bold ${typeof card.value === 'string' ? card.color : ''}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
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
