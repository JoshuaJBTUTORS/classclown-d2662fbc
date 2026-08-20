import { supabase } from '@/integrations/supabase/client';

export interface UnsubmittedAttempt {
  sessionId: string;
  assessmentId: string;
  userId: string;
  assessmentTitle: string;
  subject?: string | null;
  sessionStatus: string;
  startedAt: string;
  lastActivityAt: string | null;
  answered: number;
  totalQuestions: number;
  assignmentId: string | null;
  assignmentStatus: string | null;
}

const isSubmittedStatus = (status?: string | null) =>
  status === 'submitted' || status === 'reviewed';

/**
 * Every attempt that holds at least one real answer but never reached the
 * submitted state — whether the session is still open or was completed
 * without an assignment row behind it.
 */
export async function getUnsubmittedAttempts(): Promise<UnsubmittedAttempt[]> {
  const [{ data: sessions, error: sessionError }, { data: assignments, error: assignmentError }] =
    await Promise.all([
      supabase
        .from('assessment_sessions')
        .select('id, assessment_id, user_id, status, started_at, ai_assessments(title, subject)')
        .in('status', ['in_progress', 'completed'])
        .order('started_at', { ascending: false }),
      supabase
        .from('assessment_assignments')
        .select('id, assessment_id, assigned_to, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

  if (sessionError) throw sessionError;
  if (assignmentError) throw assignmentError;

  // Latest assignment per (assessment, student).
  const assignmentByKey = new Map<string, { id: string; status: string }>();
  for (const a of assignments ?? []) {
    const key = `${a.assessment_id}:${a.assigned_to}`;
    if (!assignmentByKey.has(key)) assignmentByKey.set(key, { id: a.id, status: a.status });
  }

  const candidates = (sessions ?? []).filter(
    (s: any) => !isSubmittedStatus(assignmentByKey.get(`${s.assessment_id}:${s.user_id}`)?.status),
  );
  if (candidates.length === 0) return [];

  const sessionIds = candidates.map((s: any) => s.id);
  const { data: responses, error: responseError } = await supabase
    .from('student_responses')
    .select('session_id, student_answer, submitted_at, updated_at')
    .in('session_id', sessionIds);

  if (responseError) throw responseError;

  const stats = new Map<string, { answered: number; lastActivityAt: string | null }>();
  for (const r of responses ?? []) {
    if (!(r.student_answer ?? '').trim()) continue;
    const entry = stats.get(r.session_id) ?? { answered: 0, lastActivityAt: null };
    entry.answered += 1;
    const activity = r.submitted_at ?? r.updated_at ?? null;
    if (activity && (!entry.lastActivityAt || activity > entry.lastActivityAt)) {
      entry.lastActivityAt = activity;
    }
    stats.set(r.session_id, entry);
  }

  const assessmentIds = Array.from(new Set(candidates.map((s: any) => s.assessment_id)));
  const { data: questions, error: questionError } = await supabase
    .from('assessment_questions')
    .select('assessment_id')
    .in('assessment_id', assessmentIds);

  if (questionError) throw questionError;

  const questionCounts = new Map<string, number>();
  for (const q of questions ?? []) {
    questionCounts.set(q.assessment_id, (questionCounts.get(q.assessment_id) ?? 0) + 1);
  }

  return candidates
    .filter((s: any) => (stats.get(s.id)?.answered ?? 0) > 0)
    .map((s: any) => {
      const assignment = assignmentByKey.get(`${s.assessment_id}:${s.user_id}`) ?? null;
      const stat = stats.get(s.id)!;
      return {
        sessionId: s.id,
        assessmentId: s.assessment_id,
        userId: s.user_id,
        assessmentTitle: s.ai_assessments?.title ?? 'Untitled Assessment',
        subject: s.ai_assessments?.subject ?? null,
        sessionStatus: s.status,
        startedAt: s.started_at,
        lastActivityAt: stat.lastActivityAt,
        answered: stat.answered,
        totalQuestions: questionCounts.get(s.assessment_id) ?? 0,
        assignmentId: assignment?.id ?? null,
        assignmentStatus: assignment?.status ?? null,
      };
    })
    .sort((a, b) => (b.lastActivityAt ?? b.startedAt).localeCompare(a.lastActivityAt ?? a.startedAt));
}

/** Closes the session and files it as submitted (service-role side effects). */
export async function submitOnBehalf(sessionId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('close-stale-assessment-sessions', {
    body: { sessionId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** Puts an assignment back to "assigned" so the student can start afresh. */
export async function resetAssignmentToAssigned(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('assessment_assignments')
    .update({ status: 'assigned', submitted_at: null, reviewed_at: null, reviewed_by: null })
    .eq('id', assignmentId);
  if (error) throw error;
}
