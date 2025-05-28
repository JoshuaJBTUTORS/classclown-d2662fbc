
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, UserX, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReportSummaryCardsProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedTutors: string[];
    selectedSubjects: string[];
  };
}

const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ filters }) => {
  const [summaryData, setSummaryData] = useState({
    totalHours: 0,
    totalLessons: 0,
    activeTutors: 0,
    absenceLessons: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, [filters]);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      // Build base query for completed lessons
      let lessonsQuery = supabase
        .from('lessons')
        .select(`
          id,
          start_time,
          end_time,
          tutor_id,
          subject,
          tutors!inner(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed');

      // Apply filters
      if (filters.dateRange.from) {
        lessonsQuery = lessonsQuery.gte('start_time', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        lessonsQuery = lessonsQuery.lte('end_time', filters.dateRange.to.toISOString());
      }
      if (filters.selectedTutors.length > 0) {
        lessonsQuery = lessonsQuery.in('tutor_id', filters.selectedTutors);
      }
      if (filters.selectedSubjects.length > 0) {
        lessonsQuery = lessonsQuery.in('subject', filters.selectedSubjects);
      }

      const { data: lessons, error } = await lessonsQuery;

      if (error) throw error;

      // Calculate summary metrics
      const totalLessons = lessons?.length || 0;
      const totalHours = lessons?.reduce((sum, lesson) => {
        const start = new Date(lesson.start_time);
        const end = new Date(lesson.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) || 0;

      const activeTutors = new Set(lessons?.map(lesson => lesson.tutor_id)).size;

      // Calculate absence lessons separately - get lessons with all students absent
      let absenceQuery = supabase
        .from('lessons')
        .select(`
          id,
          lesson_students!inner(
            student_id
          )
        `)
        .eq('status', 'completed');

      // Apply same filters for absence calculation
      if (filters.dateRange.from) {
        absenceQuery = absenceQuery.gte('start_time', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        absenceQuery = absenceQuery.lte('end_time', filters.dateRange.to.toISOString());
      }
      if (filters.selectedTutors.length > 0) {
        absenceQuery = absenceQuery.in('tutor_id', filters.selectedTutors);
      }
      if (filters.selectedSubjects.length > 0) {
        absenceQuery = absenceQuery.in('subject', filters.selectedSubjects);
      }

      const { data: lessonsWithStudents } = await absenceQuery;

      let absenceLessons = 0;
      if (lessonsWithStudents) {
        // For each lesson, check if all students were absent
        for (const lesson of lessonsWithStudents) {
          if (lesson.lesson_students.length > 0) {
            // Get attendance for this lesson
            const { data: attendanceData } = await supabase
              .from('lesson_attendance')
              .select('student_id, attendance_status')
              .eq('lesson_id', lesson.id);

            if (attendanceData && attendanceData.length > 0) {
              // Check if all students were absent
              const allAbsent = lesson.lesson_students.every(ls => 
                attendanceData.some(att => 
                  att.student_id === ls.student_id && att.attendance_status === 'absent'
                )
              );
              
              if (allAbsent) {
                absenceLessons++;
              }
            }
          }
        }
      }

      setSummaryData({
        totalHours: Math.round(totalHours * 10) / 10,
        totalLessons,
        activeTutors,
        absenceLessons
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      title: "Total Hours",
      value: loading ? "..." : `${summaryData.totalHours}h`,
      icon: Clock,
      description: "Total teaching hours completed"
    },
    {
      title: "Total Lessons",
      value: loading ? "..." : summaryData.totalLessons.toString(),
      icon: Calendar,
      description: "Lessons completed in period"
    },
    {
      title: "Active Tutors",
      value: loading ? "..." : summaryData.activeTutors.toString(),
      icon: Users,
      description: "Tutors who completed lessons"
    },
    {
      title: "Full Absences",
      value: loading ? "..." : summaryData.absenceLessons.toString(),
      icon: UserX,
      description: "Lessons with all students absent"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportSummaryCards;
