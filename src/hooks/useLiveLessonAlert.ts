import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/contexts/AuthContext';

export interface LiveLesson {
  id: string;
  title: string;
  subject?: string | null;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: string;
  tutor?: {
    first_name: string;
    last_name: string;
  };
}

interface DismissedEntry {
  lessonId: string;
  reShowAt?: number; // timestamp ms; if set, popup re-arms after this time (snooze)
}

const DISMISS_KEY = 'live-lesson-alert-dismissed';
const POLL_INTERVAL_MS = 60_000; // 1 minute
const SOON_WINDOW_MIN = 10; // show popup up to 10 min before start

function readDismissed(): DismissedEntry[] {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop expired snoozes (reShowAt in the past means it should re-arm)
    const now = Date.now();
    return parsed.filter((e: DismissedEntry) => {
      if (!e?.lessonId) return false;
      if (e.reShowAt && e.reShowAt <= now) return false; // snooze expired -> re-arm
      return true;
    });
  } catch {
    return [];
  }
}

function writeDismissed(entries: DismissedEntry[]) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota errors */
  }
}

function isDismissed(lessonId: string): boolean {
  return readDismissed().some(e => e.lessonId === lessonId);
}

export function useLiveLessonAlert() {
  const { userRole, user } = useAuth();
  const [activeLesson, setActiveLesson] = useState<LiveLesson | null>(null);
  const fetchingRef = useRef(false);

  const fetchLiveLessons = useCallback(async () => {
    const role: AppRole | null = userRole;
    const email = user?.email || null;
    if (!role || !email) return;
    if (role !== 'student' && role !== 'parent') return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      let studentIds: number[] = [];

      if (role === 'student') {
        const { data: studentData, error } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (error || !studentData) return;
        studentIds = [studentData.id];
      } else {
        // parent
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (parentError || !parentData) return;
        const { data: children, error: childError } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', parentData.id);
        if (childError || !children || children.length === 0) return;
        studentIds = children.map((c: any) => c.id);
      }

      const now = new Date();
      const soonStart = new Date(now.getTime() + SOON_WINDOW_MIN * 60 * 1000);

      const { data: lessons, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          subject,
          start_time,
          end_time,
          is_group,
          status,
          tutor:tutors(first_name, last_name),
          lesson_students!inner(student_id)
        `)
        .in('lesson_students.student_id', studentIds)
        // Normal lessons remain `scheduled` while they are upcoming/live.
        // `approved` is retained for older records and `in_progress` for sessions
        // whose status is advanced when the classroom opens.
        .in('status', ['scheduled', 'in_progress', 'approved'])
        .gte('end_time', now.toISOString())          // not yet finished
        .lte('start_time', soonStart.toISOString())  // starting within 10 min or already started
        .order('start_time', { ascending: true });

      if (lessonError || !lessons) return;

      // Filter out dismissed (non-snooze-expired) lessons
      const available = lessons.filter((l: LiveLesson) => !isDismissed(l.id));
      // Prefer a lesson that has already started; otherwise the soonest upcoming
      const started = available.find(l => new Date(l.start_time) <= now);
      const chosen = started || available[0] || null;
      // Only set if within the live/soon window (start <= now+10min and end >= now)
      if (chosen) {
        const start = new Date(chosen.start_time);
        const end = new Date(chosen.end_time);
        if (start <= soonStart && end >= now) {
          setActiveLesson(chosen);
          return;
        }
      }
      setActiveLesson(null);
    } catch (err) {
      console.error('useLiveLessonAlert error:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, [userRole, user?.email]);

  // Immediate fetch on load / role resolution + polling
  useEffect(() => {
    if (userRole !== 'student' && userRole !== 'parent') {
      setActiveLesson(null);
      return;
    }
    // Fire straight away on mount / page load, then again shortly after in case
    // the session/role was still settling on the first attempt.
    fetchLiveLessons();
    const kick = setTimeout(() => fetchLiveLessons(), 1500);
    const interval = setInterval(fetchLiveLessons, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, [fetchLiveLessons, userRole]);

  // Re-check on sign-in so the popup appears right after login.
  // TOKEN_REFRESHED is ignored: it fires on tab focus and adds needless churn.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // defer to avoid running inside the auth callback
        setTimeout(() => fetchLiveLessons(), 0);
      }
      if (event === 'SIGNED_OUT') {
        setActiveLesson(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchLiveLessons]);

  // Re-check when the tab becomes visible again, throttled so quick tab
  // switches don't refire the query.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastVisibilityFetchRef.current < VISIBILITY_THROTTLE_MS) return;
      lastVisibilityFetchRef.current = now;
      fetchLiveLessons();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchLiveLessons]);



  const dismiss = useCallback((lessonId: string, snoozeMinutes?: number) => {
    const entries = readDismissed().filter(e => e.lessonId !== lessonId);
    entries.push({
      lessonId,
      reShowAt: snoozeMinutes ? Date.now() + snoozeMinutes * 60 * 1000 : undefined,
    });
    writeDismissed(entries);
    setActiveLesson(prev => (prev?.id === lessonId ? null : prev));
    // Re-fetch in case another lesson is live
    setTimeout(() => fetchLiveLessons(), 300);
  }, [fetchLiveLessons]);

  const clearAll = useCallback(() => {
    writeDismissed([]);
    setActiveLesson(null);
    fetchLiveLessons();
  }, [fetchLiveLessons]);

  return { activeLesson, dismiss, clearAll };
}
