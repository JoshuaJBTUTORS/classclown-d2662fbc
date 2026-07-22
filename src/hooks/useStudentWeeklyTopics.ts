import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyLessonEntry {
  lessonId: string;
  title: string;
  subject: string;
  startTime: string;
  topics: string[];
  hasSummary: boolean;
  confidenceScore: number | null;
  engagementScore: number | null;
  engagementLevel: string | null;
  attendanceStatus: string | null;
  lessonStatus: string | null;
  isMeaningful: boolean;
  wasLate: boolean;
  homeworkBrief: {
    subject?: string;
    year_group?: string;
    topics?: string[];
    difficulty_tag?: string;
  } | null;
}

export interface SubjectGroup {
  subject: string;
  lessons: WeeklyLessonEntry[];
}

// Monday 00:00 of the London week containing d.
function startOfLondonWeek(d: Date): Date {
  const londonNow = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const day = londonNow.getDay();
  const diffToMonday = (day + 6) % 7;
  londonNow.setHours(0, 0, 0, 0);
  londonNow.setDate(londonNow.getDate() - diffToMonday);
  return londonNow;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useStudentWeeklyTopics(studentId: string | number | undefined) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfLondonWeek(new Date()));
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const weekEnd = useMemo(() => {
    const e = new Date(weekStart);
    e.setDate(e.getDate() + 7);
    return e;
  }, [weekStart]);

  useEffect(() => {
    if (studentId === undefined || studentId === null) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('student_lesson_insights')
          .select(
            'lesson_id, subject, lesson_title, lesson_start_time, topics, confidence_score, engagement_score, engagement_level, attendance_status, lesson_status, is_meaningful'
          )
          .eq('student_id', Number(studentId))
          .eq('week_start_date', toIsoDate(weekStart))
          .order('lesson_start_time', { ascending: true });

        if (error) throw error;

        const bySubject = new Map<string, WeeklyLessonEntry[]>();
        let missed = 0;
        let cancelledN = 0;

        (data ?? []).forEach((row: any) => {
          const lessonStatus = row.lesson_status ?? null;
          const attendance = row.attendance_status ?? null;

          if (lessonStatus === 'cancelled') {
            cancelledN += 1;
            return;
          }
          if (attendance && !['attended', 'late'].includes(attendance)) {
            missed += 1;
            return;
          }

          const subject = row.subject || 'Uncategorised';
          const entry: WeeklyLessonEntry = {
            lessonId: row.lesson_id,
            title: row.lesson_title || 'Untitled lesson',
            subject,
            startTime: row.lesson_start_time,
            topics: Array.isArray(row.topics) ? row.topics : [],
            hasSummary: true,
            confidenceScore: row.confidence_score ?? null,
            engagementScore: row.engagement_score ?? null,
            engagementLevel: row.engagement_level ?? null,
            attendanceStatus: attendance,
            lessonStatus,
            isMeaningful: !!row.is_meaningful,
            wasLate: attendance === 'late',
          };
          if (!bySubject.has(subject)) bySubject.set(subject, []);
          bySubject.get(subject)!.push(entry);
        });

        const grouped: SubjectGroup[] = Array.from(bySubject.entries())
          .map(([subject, lessons]) => ({ subject, lessons }))
          .sort((a, b) => a.subject.localeCompare(b.subject));

        if (!cancelled) {
          setGroups(grouped);
          setMissedCount(missed);
          setCancelledCount(cancelledN);
        }
      } catch (err) {
        console.error('useStudentWeeklyTopics error', err);
        if (!cancelled) {
          setGroups([]);
          setMissedCount(0);
          setCancelledCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, weekStart]);

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goThisWeek = () => setWeekStart(startOfLondonWeek(new Date()));

  return { groups, missedCount, cancelledCount, isLoading, weekStart, weekEnd, goPrev, goNext, goThisWeek };
}
