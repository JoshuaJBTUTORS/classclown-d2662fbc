import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TutorBreach {
  id: string;
  lesson_id: string | null;
  tutor_name: string | null;
  lesson_title: string | null;
  lesson_date: string | null;
  students: string | null;
  category: string;
  severity: string;
  summary: string;
  evidence: string[];
  created_at: string;
}

export const useTutorBreaches = () => {
  const [breaches, setBreaches] = useState<TutorBreach[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setBreaches([]);
      setLoading(false);
      return;
    }

    const [{ data: rows, error }, { data: dismissed }] = await Promise.all([
      supabase
        .from('tutor_breaches')
        .select('id, lesson_id, tutor_name, lesson_title, lesson_date, students, category, severity, summary, evidence, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('tutor_breach_dismissals')
        .select('breach_id')
        .eq('user_id', userId),
    ]);

    if (error) {
      console.error('Failed to load tutor breaches:', error);
      setBreaches([]);
    } else {
      const hidden = new Set((dismissed ?? []).map((d: { breach_id: string }) => d.breach_id));
      setBreaches(
        (rows ?? [])
          .filter((r) => !hidden.has(r.id))
          .map((r) => ({
            ...r,
            evidence: Array.isArray(r.evidence) ? (r.evidence as string[]) : [],
          })) as TutorBreach[],
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismiss = useCallback(async (breachId: string) => {
    setBreaches((prev) => prev.filter((b) => b.id !== breachId));
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    const { error } = await supabase
      .from('tutor_breach_dismissals')
      .insert({ breach_id: breachId, user_id: userId });
    if (error && error.code !== '23505') {
      console.error('Failed to dismiss breach:', error);
      load();
    }
  }, [load]);

  const dismissAll = useCallback(async () => {
    const ids = breaches.map((b) => b.id);
    setBreaches([]);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId || ids.length === 0) return;
    const { error } = await supabase
      .from('tutor_breach_dismissals')
      .upsert(ids.map((id) => ({ breach_id: id, user_id: userId })), { onConflict: 'breach_id,user_id' });
    if (error) {
      console.error('Failed to dismiss breaches:', error);
      load();
    }
  }, [breaches, load]);

  return { breaches, loading, dismiss, dismissAll, reload: load };
};
