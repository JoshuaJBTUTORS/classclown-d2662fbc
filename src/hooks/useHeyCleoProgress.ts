import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { HeyCleoHomeworkRow } from '@/hooks/useHeyCleoStudents';

const norm = (v?: string | null) => (v ? v.toLowerCase().trim() : '');

export interface HeyCleoStudentProgress {
  crmStudentId: number;
  name: string;
  heycleoStudentId: string | null;
  homework: HeyCleoHomeworkRow[];
  total: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number | null;
  averageScore: number | null;
}

export interface HeyCleoProgressData {
  students: HeyCleoStudentProgress[];
  homework: HeyCleoHomeworkRow[];
  totalHomework: number;
  completedHomework: number;
  averageScore: number | null;
  completionRate: number | null;
}

const EMPTY: HeyCleoProgressData = {
  students: [],
  homework: [],
  totalHomework: 0,
  completedHomework: 0,
  averageScore: null,
  completionRate: null,
};

function summarise(rows: HeyCleoHomeworkRow[]) {
  const now = Date.now();
  const total = rows.length;
  const completedCount = rows.filter((h) => h.completed).length;
  const overdueCount = rows.filter(
    (h) => !h.completed && h.due_date && new Date(h.due_date).getTime() < now,
  ).length;
  const scored = rows.filter((h) => h.marks_available != null && Number(h.marks_available) > 0);
  const awarded = scored.reduce((s, h) => s + Number(h.marks_awarded ?? 0), 0);
  const available = scored.reduce((s, h) => s + Number(h.marks_available ?? 0), 0);
  return {
    total,
    completedCount,
    overdueCount,
    completionRate: total ? Math.round((completedCount / total) * 100) : null,
    averageScore: available > 0 ? Math.round((awarded / available) * 100) : null,
  };
}

/**
 * HeyCleo homework data scoped to the signed-in account:
 * - student: their own CRM record
 * - parent: all of their children
 * - owner/admin: the students selected in the page filters (all if none)
 */
export function useHeyCleoProgress(selectedStudentIds: string[] = []) {
  const { user, userRole } = useAuth();
  const selectedKey = [...selectedStudentIds].sort().join(',');

  const query = useQuery({
    queryKey: ['heycleo-progress', user?.id, userRole, selectedKey],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HeyCleoProgressData> => {
      if (!user) return EMPTY;

      // 1. Resolve the CRM students this account is allowed to see
      let crmStudents: { id: number; first_name: string | null; last_name: string | null; email: string | null; parent_id: string | null }[] = [];

      if (userRole === 'student') {
        const { data } = await supabase
          .from('students')
          .select('id, first_name, last_name, email, parent_id')
          .or(`user_id.eq.${user.id},email.eq.${user.email ?? ''}`);
        crmStudents = data ?? [];
      } else if (userRole === 'parent') {
        const { data: parent } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (parent) {
          const { data } = await supabase
            .from('students')
            .select('id, first_name, last_name, email, parent_id')
            .eq('parent_id', parent.id);
          crmStudents = data ?? [];
        }
      } else {
        let q = supabase
          .from('students')
          .select('id, first_name, last_name, email, parent_id')
          .limit(2000);
        const numericIds = selectedStudentIds.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        if (numericIds.length) q = q.in('id', numericIds);
        const { data } = await q;
        crmStudents = data ?? [];
      }

      if (!crmStudents.length) return EMPTY;

      // 2. Parent emails (a family's HeyCleo account is often the parent's)
      const parentIds = [...new Set(crmStudents.map((s) => s.parent_id).filter(Boolean))] as string[];
      const parentEmail = new Map<string, string>();
      if (parentIds.length) {
        const { data: parents } = await supabase.from('parents').select('id, email').in('id', parentIds);
        (parents ?? []).forEach((p) => {
          if (p.email) parentEmail.set(p.id, norm(p.email));
        });
      }

      // 3. Match to HeyCleo accounts by email
      const { data: heycleoStudents } = await supabase
        .from('heycleo_students')
        .select('student_id, email')
        .limit(5000);

      const byEmail = new Map<string, string>();
      (heycleoStudents ?? []).forEach((h) => {
        const key = norm(h.email);
        if (key && !byEmail.has(key)) byEmail.set(key, h.student_id);
      });

      const linked = new Map<number, string>();
      crmStudents.forEach((s) => {
        const direct = byEmail.get(norm(s.email));
        if (direct) {
          linked.set(s.id, direct);
          return;
        }
        if (s.parent_id) {
          const viaParent = byEmail.get(parentEmail.get(s.parent_id) ?? '');
          if (viaParent) linked.set(s.id, viaParent);
        }
      });

      const heycleoIds = [...new Set(linked.values())];
      let rows: HeyCleoHomeworkRow[] = [];
      if (heycleoIds.length) {
        const { data, error } = await supabase
          .from('heycleo_homework_completion')
          .select('*')
          .in('student_id', heycleoIds)
          .order('due_date', { ascending: false, nullsFirst: false })
          .limit(2000);
        if (error) throw error;
        rows = (data ?? []) as unknown as HeyCleoHomeworkRow[];
      }

      const byHeycleoId = new Map<string, HeyCleoHomeworkRow[]>();
      rows.forEach((h) => {
        if (!h.student_id) return;
        const arr = byHeycleoId.get(h.student_id);
        if (arr) arr.push(h);
        else byHeycleoId.set(h.student_id, [h]);
      });

      const students: HeyCleoStudentProgress[] = crmStudents.map((s) => {
        const heycleoStudentId = linked.get(s.id) ?? null;
        const homework = heycleoStudentId ? byHeycleoId.get(heycleoStudentId) ?? [] : [];
        return {
          crmStudentId: s.id,
          name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `Student ${s.id}`,
          heycleoStudentId,
          homework,
          ...summarise(homework),
        };
      });

      const overall = summarise(rows);

      return {
        students,
        homework: rows,
        totalHomework: overall.total,
        completedHomework: overall.completedCount,
        averageScore: overall.averageScore,
        completionRate: overall.completionRate,
      };
    },
  });

  return {
    data: query.data ?? EMPTY,
    isLoading: query.isLoading,
  };
}
