import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import ProgressPanel from './ProgressPanel';
import { DoodleEmpty } from './ProgressDoodles';

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
          lesson:lessons!inner(
            start_time,
            subject,
            title
          ),
          student:students!inner(
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
        } else {
          console.log('No student record found for user:', user.email);
          setData([]);
          setLoading(false);
          return;
        }
      }

      // Apply owner filters
      if (userRole === 'owner') {
        if (filters.selectedStudents.length > 0) {
          // Convert user IDs to student IDs for attendance filtering
          const { data: studentData } = await supabase
            .from('students')
            .select('id, user_id')
            .in('user_id', filters.selectedStudents);

          if (studentData && studentData.length > 0) {
            const studentIds = studentData.map(s => s.id);
            query = query.in('student_id', studentIds);
          }
        }
      }

      const { data: attendance, error } = await query;

      if (error) {
        console.error('Attendance query error:', error);
        throw error;
      }

      console.log('Raw attendance data:', attendance);

      if (!attendance || attendance.length === 0) {
        console.log('No attendance data found');
        setData([]);
        setLoading(false);
        return;
      }

      // Group by week and calculate attendance percentages
      const weeklyData = new Map<string, { attended: number; total: number }>();

      attendance?.forEach(record => {
        if (!record.lesson || !record.lesson.start_time) {
          console.log('Invalid lesson data:', record);
          return;
        }

        const lessonDate = parseISO(record.lesson.start_time);
        
        // Apply date range filter
        if (filters.dateRange.from && lessonDate < filters.dateRange.from) return;
        if (filters.dateRange.to && lessonDate > filters.dateRange.to) return;

        // Apply subject filter
        if (filters.selectedSubjects.length > 0 && 
            !filters.selectedSubjects.includes(record.lesson.subject || 'General')) return;

        const weekStart = startOfWeek(lessonDate, { weekStartsOn: 1 }); // Start week on Monday
        const weekKey = format(weekStart, 'MMM dd');

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, { attended: 0, total: 0 });
        }

        const weekData = weeklyData.get(weekKey)!;
        weekData.total++;
        
        // Consider 'present' and 'attended' as attended (handle different status values)
        if (record.attendance_status === 'present' || record.attendance_status === 'attended') {
          weekData.attended++;
        }
      });

      console.log('Weekly data map:', weeklyData);

      const chartData: AttendanceData[] = Array.from(weeklyData.entries()).map(([week, data]) => ({
        week,
        attended: data.attended,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0
      }));

      console.log('Final chart data:', chartData);
      setData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const description =
    userRole === 'owner' ? 'Student attendance rates by week' : 'Your attendance rates by week';

  if (loading) {
    return (
      <ProgressPanel title="Attendance" description="Loading attendance data...">
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-muted" />
      </ProgressPanel>
    );
  }

  const bandFor = (percentage: number) => {
    if (percentage >= 90) return 'bg-pastel-mint text-pastel-mint-foreground';
    if (percentage >= 70) return 'bg-pastel-sky text-pastel-sky-foreground';
    if (percentage >= 40) return 'bg-pastel-butter text-pastel-butter-foreground';
    return 'bg-pastel-blush text-pastel-blush-foreground';
  };

  const overall =
    data.length > 0
      ? Math.round(
          (data.reduce((sum, d) => sum + d.attended, 0) / Math.max(data.reduce((sum, d) => sum + d.total, 0), 1)) * 100,
        )
      : 0;

  return (
    <ProgressPanel
      title="Attendance"
      description={description}
      action={
        data.length > 0 ? (
          <span className="rounded-full bg-pastel-mint px-3 py-1 font-heading text-sm font-semibold text-pastel-mint-foreground">
            {overall}%
          </span>
        ) : undefined
      }
    >
      <div className="min-h-[18rem]">
        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
              {data.map((week) => (
                <div
                  key={week.week}
                  title={`Week of ${week.week}: ${week.attended}/${week.total} attended (${week.percentage}%)`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-[0.9rem] transition-transform duration-200 hover:-translate-y-0.5 ${bandFor(week.percentage)}`}
                >
                  <span className="font-heading text-sm font-bold leading-none">{week.percentage}%</span>
                  <span className="mt-1 text-[10px] opacity-75">{week.week}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {[
                { label: '90%+', cls: 'bg-pastel-mint' },
                { label: '70–89%', cls: 'bg-pastel-sky' },
                { label: '40–69%', cls: 'bg-pastel-butter' },
                { label: 'Below 40%', cls: 'bg-pastel-blush' },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-[0.35rem] ${item.cls}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
            <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No attendance yet</p>
            <p className="text-xs text-muted-foreground/80">Nothing matches these filters</p>
          </div>
        )}
      </div>
    </ProgressPanel>
  );
};

export default AttendanceChart;

