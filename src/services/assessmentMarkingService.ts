import { supabase } from '@/integrations/supabase/client';

export interface MarkSessionResult {
  success: boolean;
  done: boolean;
  marked: number;
  skipped: number;
  remaining: number;
  failed: number;
  totalAchieved: number;
  totalAvailable: number;
}

/**
 * Marks the answers in a single assessment session with AI.
 * The edge function works within a time budget, so callers should keep
 * invoking it until `done` is true.
 */
export async function markSession(sessionId: string, remark = false): Promise<MarkSessionResult> {
  const { data, error } = await supabase.functions.invoke('mark-assessment-session', {
    body: { sessionId, remark },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as MarkSessionResult;
}

/** Marks every answer in a session, looping until the function reports completion. */
export async function markSessionToCompletion(
  sessionId: string,
  onProgress?: (marked: number) => void,
): Promise<number> {
  let marked = 0;
  for (let pass = 0; pass < 20; pass++) {
    const result = await markSession(sessionId);
    marked += result.marked ?? 0;
    onProgress?.(marked);
    if (result.done) break;
  }
  return marked;
}

/** Finds the most recent session for each (assessment, user) pair. */
export async function getLatestSessionId(assessmentId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('assessment_sessions')
    .select('id')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0]?.id ?? null;
}
