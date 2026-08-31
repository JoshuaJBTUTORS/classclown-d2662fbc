import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CUSTOMERS_SETTING_KEY,
  GOAL_DEADLINE,
  GOAL_START,
} from '@/lib/goals';

export interface DailySnapshotData {
  sessionsToday: number | null;
  sessionsDone: number | null;
  sessionsUpcoming: number | null;
  trialsToday: number | null;
  pendingTimeOff: number | null;
  proposalsThisWeek: number | null;
  proposalsToday: number | null;
  proposalsAwaiting: number | null;
  missedThisWeek: number | null;
  homeworkSetThisWeek: number | null;
  homeworkSubmittedThisWeek: number | null;
  // Goals
  goalTrials: number | null;
  goalLessons: number | null;
  goalProposals: number | null;
  goalCustomers: number | null;
}

const EMPTY: DailySnapshotData = {
  sessionsToday: null,
  sessionsDone: null,
  sessionsUpcoming: null,
  trialsToday: null,
  pendingTimeOff: null,
  proposalsThisWeek: null,
  proposalsToday: null,
  proposalsAwaiting: null,
  missedThisWeek: null,
  homeworkSetThisWeek: null,
  homeworkSubmittedThisWeek: null,
  goalTrials: null,
  goalLessons: null,
  goalProposals: null,
  goalCustomers: null,
};

function londonDayBounds(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function londonDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useDailySnapshot() {
  const [data, setData] = useState<DailySnapshotData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const { start: dayStart, end: dayEnd } = londonDayBounds(now);
    const todayStr = londonDateString(now);

    // Week start (Monday) -> now
    const weekStart = new Date(dayStart);
    const dow = (weekStart.getDay() + 6) % 7; // 0 = Monday
    weekStart.setDate(weekStart.getDate() - dow);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const results = await Promise.allSettled([
      supabase
        .from('lessons')
        .select('id, start_time, end_time, lesson_type')
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString()),
      supabase
        .from('trial_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('preferred_date', todayStr),
      supabase
        .from('time_off_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('lesson_proposals')
        .select('id, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString()),
      // Goals
      supabase
        .from('trial_bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', GOAL_START.toISOString())
        .lte('created_at', GOAL_DEADLINE.toISOString()),
      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .neq('lesson_type', 'trial')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString()),
      supabase
        .from('lesson_proposals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', GOAL_START.toISOString())
        .lte('completed_at', GOAL_DEADLINE.toISOString()),
      supabase
        .from('app_settings')
        .select('value')
        .eq('key', CUSTOMERS_SETTING_KEY)
        .maybeSingle(),
      // Proposals sent but not yet completed (awaiting signature)
      supabase
        .from('lesson_proposals')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'viewed']),
      // Missed lessons this week (absences marked in attendance)
      supabase
        .from('lesson_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('attendance_status', 'absent')
        .gte('marked_at', weekStart.toISOString()),
      // Homework set this week
      supabase
        .from('homework')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),
      // Homework submitted this week
      supabase
        .from('homework_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('submitted_at', weekStart.toISOString()),
    ]);

    const val = <T,>(i: number): T | null => {
      const r = results[i];
      if (r.status !== 'fulfilled') return null;
      const res: any = r.value;
      if (res?.error) return null;
      return res as T;
    };

    const lessonsRes: any = val(0);
    const lessons = (lessonsRes?.data ?? []) as any[];
    const nowMs = now.getTime();
    const sessionsToday = lessonsRes ? lessons.length : null;
    const sessionsDone = lessonsRes
      ? lessons.filter((l) => new Date(l.end_time ?? l.start_time).getTime() < nowMs).length
      : null;

    const proposalsRes: any = val(3);
    const proposals = (proposalsRes?.data ?? []) as any[];
    const proposalsThisWeek = proposalsRes ? proposals.length : null;
    const proposalsToday = proposalsRes
      ? proposals.filter((p) => p.completed_at && new Date(p.completed_at) >= dayStart).length
      : null;

    const customersRes: any = val(7);
    const customersRaw = customersRes?.data?.value;
    const customersParsed = parseInt(customersRaw ?? '', 10);

    setData({
      sessionsToday,
      sessionsDone,
      sessionsUpcoming:
        sessionsToday !== null && sessionsDone !== null ? sessionsToday - sessionsDone : null,
      trialsToday: (val(1) as any)?.count ?? null,
      pendingTimeOff: (val(2) as any)?.count ?? null,
      proposalsThisWeek,
      proposalsToday,
      proposalsAwaiting: (val(8) as any)?.count ?? null,
      missedThisWeek: (val(9) as any)?.count ?? null,
      homeworkSetThisWeek: (val(10) as any)?.count ?? null,
      homeworkSubmittedThisWeek: (val(11) as any)?.count ?? null,
      goalTrials: (val(4) as any)?.count ?? null,
      goalLessons: (val(5) as any)?.count ?? null,
      goalProposals: (val(6) as any)?.count ?? null,
      goalCustomers: Number.isFinite(customersParsed) ? customersParsed : null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}
