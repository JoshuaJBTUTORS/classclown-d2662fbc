import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChurnReason {
  code: string;
  label: string;
  detail: string;
}

export interface ChurnLesson {
  lesson_id: string;
  title: string | null;
  subject: string | null;
  date: string | null;
  missed: boolean;
}

export interface StudentChurnRisk {
  id: string;
  student_id: number;
  student_name: string | null;
  parent_name: string | null;
  parent_email: string | null;
  risk_level: string;
  score: number;
  reasons: ChurnReason[];
  lessons_considered: ChurnLesson[];
  missed_streak: number;
  avg_confidence: number | null;
  avg_engagement: number | null;
  avg_speaking_pct: number | null;
  last_lesson_date: string | null;
  created_at: string;
}

export const useStudentChurnRisks = () => {
  const [risks, setRisks] = useState<StudentChurnRisk[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setRisks([]);
      setLoading(false);
      return;
    }

    const [{ data: rows, error }, { data: dismissed }] = await Promise.all([
      supabase
        .from('student_churn_risks')
        .select(
          'id, student_id, student_name, parent_name, parent_email, risk_level, score, reasons, lessons_considered, missed_streak, avg_confidence, avg_engagement, avg_speaking_pct, last_lesson_date, created_at',
        )
        .eq('status', 'open')
        .order('score', { ascending: false })
        .limit(50),
      supabase.from('student_churn_dismissals').select('risk_id').eq('user_id', userId),
    ]);

    if (error) {
      console.error('Failed to load churn risks:', error);
      setRisks([]);
    } else {
      const hidden = new Set((dismissed ?? []).map((d: { risk_id: string }) => d.risk_id));
      setRisks(
        (rows ?? [])
          .filter((r) => !hidden.has(r.id))
          .map((r) => ({
            ...r,
            reasons: Array.isArray(r.reasons) ? (r.reasons as unknown as ChurnReason[]) : [],
            lessons_considered: Array.isArray(r.lessons_considered)
              ? (r.lessons_considered as unknown as ChurnLesson[])
              : [],
          })) as StudentChurnRisk[],
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = useCallback(async (riskId: string) => {
    setRisks((prev) => prev.filter((r) => r.id !== riskId));
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    await supabase
      .from('student_churn_dismissals')
      .upsert({ risk_id: riskId, user_id: userId }, { onConflict: 'risk_id,user_id' });
  }, []);

  const dismissAll = useCallback(async () => {
    const ids = risks.map((r) => r.id);
    setRisks([]);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId || ids.length === 0) return;
    await supabase
      .from('student_churn_dismissals')
      .upsert(ids.map((risk_id) => ({ risk_id, user_id: userId })), { onConflict: 'risk_id,user_id' });
  }, [risks]);

  return { risks, loading, dismiss, dismissAll, reload: load };
};
