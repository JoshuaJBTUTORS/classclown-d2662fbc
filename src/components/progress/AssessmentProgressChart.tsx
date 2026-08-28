import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import ProgressPanel from './ProgressPanel';
import { DoodleEmpty, DoodleLock } from './ProgressDoodles';

interface AssessmentProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects?: string[];
  };
  userRole: string;
}

interface AssessmentScore {
  date: string;
  percentage: number;
  subject: string;
  assessment_title: string;
  student_name?: string;
}

const AssessmentProgressChart: React.FC<AssessmentProgressChartProps> = ({ filters, userRole }) => {
  const [data, setData] = useState<AssessmentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkEnrollmentAccess();
  }, [user, userRole]);

  useEffect(() => {
    if (hasAccess) {
      fetchAssessmentProgress();
    } else {
      setLoading(false);
    }
  }, [filters, user, userRole, hasAccess]);

  const checkEnrollmentAccess = async () => {
    if (!user) return;

    setCheckingAccess(true);
    try {
      // Owners always have access
      if (userRole === 'owner') {
        setHasAccess(true);
        return;
      }

      // Check if user has purchased any course
      const purchases = await paymentService.getUserPurchases();
      setHasAccess(purchases.length > 0);
    } catch (error) {
      console.error('Error checking enrollment access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchAssessmentProgress = async () => {
    if (!user || !hasAccess) return;

    setLoading(true);
    try {
      let query = supabase
        .from('assessment_sessions')
        .select(`
          completed_at,
          total_marks_achieved,
          total_marks_available,
          user_id,
          assessment:ai_assessments(
            title,
            subject
          )
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .not('total_marks_available', 'is', null)
        .gt('total_marks_available', 0)
        .order('completed_at', { ascending: true });

      // Filter by user for students and parents
      if (userRole === 'student' || userRole === 'parent') {
        query = query.eq('user_id', user.id);
      }

      // Apply owner filters
      if (userRole === 'owner' && filters.selectedStudents.length > 0) {
        query = query.in('user_id', filters.selectedStudents);
      }

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('completed_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('completed_at', filters.dateRange.to.toISOString());
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      // If we need student names for owners, fetch them separately
      let userProfiles = {};
      if (userRole === 'owner' && sessions && sessions.length > 0) {
        const userIds = [...new Set(sessions.map(session => session.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (profiles) {
          userProfiles = profiles.reduce((acc, profile) => {
            acc[profile.id] = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            return acc;
          }, {});
        }
      }

      const chartData = sessions?.map(session => {
        const percentage = Math.round((session.total_marks_achieved / session.total_marks_available) * 100);
        return {
          date: format(parseISO(session.completed_at), 'MMM dd'),
          percentage,
          subject: session.assessment?.subject || 'General',
          assessment_title: session.assessment?.title || 'Assessment',
          student_name: userRole === 'owner' ? userProfiles[session.user_id] || 'Unknown' : undefined
        };
      }) || [];

      // Filter by subject if specified
      const filteredData = (filters.selectedSubjects?.length ?? 0) > 0
        ? chartData.filter(item => filters.selectedSubjects!.includes(item.subject))
        : chartData;

      setData(filteredData);
    } catch (error) {
      console.error('Error fetching assessment progress:', error);
      toast.error('Failed to load assessment progress');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAccess = () => {
    navigate('/heycleo');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="rounded-[1rem] border border-border/60 bg-card px-4 py-3 shadow-lg">
          <p className="font-heading text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm font-medium text-pastel-lilac-foreground">Score: {point.percentage}%</p>
          <p className="text-xs text-muted-foreground">{point.subject}</p>
          <p className="text-xs text-muted-foreground">{point.assessment_title}</p>
          {point.student_name && <p className="text-xs text-muted-foreground">Student: {point.student_name}</p>}
        </div>
      );
    }
    return null;
  };

  if (checkingAccess || loading) {
    return (
      <ProgressPanel title="Assessments" description={checkingAccess ? 'Checking access...' : 'Loading assessment scores...'}>
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-muted" />
      </ProgressPanel>
    );
  }

  // Show locked state for users without course access
  if (!hasAccess) {
    return (
      <ProgressPanel title="Assessments" description="Course enrolment unlocks assessment tracking">
        <div className="relative overflow-hidden rounded-[1.25rem] bg-pastel-lilac p-8 text-center text-pastel-lilac-foreground">
          <ScribbleStroke className="pointer-events-none absolute -right-8 -top-8 h-40 w-64 text-pastel-lilac-foreground/15" />
          <div className="relative mx-auto max-w-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background/60">
              <DoodleLock className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold">Unlock assessment progress</h3>
            <p className="mt-2 text-sm opacity-80">
              Purchase any course to access assessment progress tracking and detailed performance analytics.
            </p>
            <Button
              onClick={handleUnlockAccess}
              className="mt-6 rounded-full bg-pastel-lilac-foreground px-6 text-pastel-lilac hover:bg-pastel-lilac-foreground/90"
            >
              Browse courses
            </Button>
          </div>
        </div>
      </ProgressPanel>
    );
  }

  const description =
    userRole === 'owner' ? 'Student assessment scores over time' : 'Your assessment scores over time';

  return (
    <ProgressPanel title="Assessments" description={description}>
      <div className="h-72">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <XAxis
                dataKey="date"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                domain={[0, 100]}
                width={34}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Line
                type="monotone"
                dataKey="percentage"
                strokeWidth={3}
                className="stroke-pastel-lilac-foreground"
                dot={{ r: 4, strokeWidth: 0, className: 'fill-pastel-lilac-foreground' }}
                activeDot={{ r: 6, strokeWidth: 0, className: 'fill-pastel-lilac-foreground' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
            <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No assessment data yet</p>
            <p className="text-xs text-muted-foreground/80">Nothing matches these filters</p>
          </div>
        )}
      </div>
    </ProgressPanel>
  );
};

export default AssessmentProgressChart;

