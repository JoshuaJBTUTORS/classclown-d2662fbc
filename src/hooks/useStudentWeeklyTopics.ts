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
}

export interface SubjectGroup {
  subject: string;
  lessons: WeeklyLessonEntry[];
}

// Monday 00:00 of the London week containing d.
function startOfLondonWeek(d: Date): Date {
  const londonNow = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const day = londonNow.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  londonNow.setHours(0, 0, 0, 0);
  londonNow.setDate(londonNow.getDate() - diffToMonday);
  return londonNow;
}

// Format a Date as YYYY-MM-DD (local calendar day) for the `date` column.
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useStudentWeeklyTopics(studentId: string | number | undefined) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfLondonWeek(new Date()));
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
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
            'lesson_id, subject, lesson_title, lesson_start_time, topics, confidence_score, engagement_score, engagement_level'
          )
          .eq('student_id', Number(studentId))
          .eq('week_start_date', toIsoDate(weekStart))
          .order('lesson_start_time', { ascending: true });

        if (error) throw error;

        const bySubject = new Map<string, WeeklyLessonEntry[]>();
        (data ?? []).forEach((row: any) => {
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
          };
          if (!bySubject.has(subject)) bySubject.set(subject, []);
          bySubject.get(subject)!.push(entry);
        });

        const grouped: SubjectGroup[] = Array.from(bySubject.entries())
          .map(([subject, lessons]) => ({ subject, lessons }))
          .sort((a, b) => a.subject.localeCompare(b.subject));

        if (!cancelled) setGroups(grouped);
      } catch (err) {
        console.error('useStudentWeeklyTopics error', err);
        if (!cancelled) setGroups([]);
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

  return { groups, isLoading, weekStart, weekEnd, goPrev, goNext, goThisWeek };
}
