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

// Get Monday 00:00 of the week containing the given date, in Europe/London.
// Uses local Date math shifted by London offset — good enough for UI grouping.
function startOfLondonWeek(d: Date): Date {
  // Format date parts in London TZ
  const londonNow = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const day = londonNow.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // Sun->6, Mon->0, Tue->1...
  londonNow.setHours(0, 0, 0, 0);
  londonNow.setDate(londonNow.getDate() - diffToMonday);
  return londonNow;
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
        // 1) lesson ids the student is on
        const { data: linkRows, error: linkErr } = await supabase
          .from('lesson_students')
          .select('lesson_id')
          .eq('student_id', Number(studentId));
        if (linkErr) throw linkErr;
        const lessonIds = (linkRows ?? []).map((r: any) => r.lesson_id).filter(Boolean);
        if (lessonIds.length === 0) {
          if (!cancelled) setGroups([]);
          return;
        }

        // 2) lessons within the week
        const { data: lessons, error: lessonsErr } = await supabase
          .from('lessons')
          .select('id, title, subject, start_time')
          .in('id', lessonIds)
          .gte('start_time', weekStart.toISOString())
          .lt('start_time', weekEnd.toISOString())
          .order('start_time', { ascending: true });
        if (lessonsErr) throw lessonsErr;

        const weekLessonIds = (lessons ?? []).map((l: any) => l.id);
        if (weekLessonIds.length === 0) {
          if (!cancelled) setGroups([]);
          return;
        }

        // 3) per-student summaries for those lessons
        const { data: summaries, error: sumErr } = await supabase
          .from('lesson_student_summaries')
          .select('lesson_id, topics_covered')
          .eq('student_id', Number(studentId))
          .in('lesson_id', weekLessonIds);
        if (sumErr) throw sumErr;

        const topicsByLesson = new Map<string, string[]>();
        (summaries ?? []).forEach((s: any) => {
          topicsByLesson.set(s.lesson_id, Array.isArray(s.topics_covered) ? s.topics_covered : []);
        });

        // 4) group by subject
        const bySubject = new Map<string, WeeklyLessonEntry[]>();
        (lessons ?? []).forEach((l: any) => {
          const subject = l.subject || 'Uncategorised';
          const entry: WeeklyLessonEntry = {
            lessonId: l.id,
            title: l.title || 'Untitled lesson',
            subject,
            startTime: l.start_time,
            topics: topicsByLesson.get(l.id) ?? [],
            hasSummary: topicsByLesson.has(l.id),
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
  }, [studentId, weekStart, weekEnd]);

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
