import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HeyCleoHomeworkRow, HeyCleoStudentRow } from '@/hooks/useHeyCleoStudents';

export type HomeworkStatusState = 'completed' | 'started' | 'not_started' | 'no_data';

export interface HeyCleoHomeworkStatus {
  state: HomeworkStatusState;
  title: string | null;
  dueDate: string | null;
  marksAwarded: number | null;
  marksAvailable: number | null;
  percentage: number | null;
}

const norm = (v?: string | null) => (v ? v.toLowerCase().trim() : '');

/**
 * For a set of CRM student ids, resolve their HeyCleo account and return the
 * status of the most recent homework whose due date has already passed
 * ("last week's homework").
 */
export function useHeyCleoHomeworkStatus(studentIds: number[]) {
  const ids = [...new Set(studentIds.filter((id) => typeof id === 'number'))].sort((a, b) => a - b);

  const query = useQuery({
    queryKey: ['heycleo-homework-status', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<{ statuses: Record<number, HeyCleoHomeworkStatus>; links: Record<number, string> }> => {
      const result: Record<number, HeyCleoHomeworkStatus> = {};
      const links: Record<number, string> = {};
      ids.forEach((id) => {
        result[id] = {
          state: 'no_data',
          title: null,
          dueDate: null,
          marksAwarded: null,
          marksAvailable: null,
          percentage: null,
        };
      });

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, email, parent_id')
        .in('id', ids);
      if (studentsError) throw studentsError;
      if (!students?.length) return { statuses: result, links };

      const parentIds = [...new Set(students.map((s) => s.parent_id).filter(Boolean))] as string[];

      // Parent emails (a family's HeyCleo account is shared by all their children)
      const parentEmails = new Map<string, string>();
      if (parentIds.length) {
        const { data: parents } = await supabase
          .from('parents')
          .select('id, email')
          .in('id', parentIds);
        (parents ?? []).forEach((p) => {
          if (p.email) parentEmails.set(p.id, norm(p.email));
        });
      }


      const { data: heycleoStudents, error: hcError } = await supabase
        .from('heycleo_students')
        .select('student_id, email')
        .limit(5000);
      if (hcError) throw hcError;

      const byEmail = new Map<string, string>();
      ((heycleoStudents ?? []) as Pick<HeyCleoStudentRow, 'student_id' | 'email'>[]).forEach((h) => {
        const key = norm(h.email);
        if (key && !byEmail.has(key)) byEmail.set(key, h.student_id);
      });

      // CRM student id -> heycleo student id
      const linked = new Map<number, string>();
      students.forEach((s) => {
        const direct = byEmail.get(norm(s.email));
        if (direct) {
          linked.set(s.id, direct);
          return;
        }
        if (s.parent_id && (siblingCount.get(s.parent_id) ?? 0) === 1) {
          const viaParent = byEmail.get(parentEmails.get(s.parent_id) ?? '');
          if (viaParent) linked.set(s.id, viaParent);
        }
      });

      const heycleoIds = [...new Set(linked.values())];
      linked.forEach((heycleoId, crmId) => {
        links[crmId] = heycleoId;
      });
      if (!heycleoIds.length) return { statuses: result, links };

      const { data: homework, error: hwError } = await supabase
        .from('heycleo_homework_completion')
        .select('*')
        .in('student_id', heycleoIds)
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: false })
        .limit(2000);
      if (hwError) throw hwError;

      const latest = new Map<string, HeyCleoHomeworkRow>();
      ((homework ?? []) as unknown as HeyCleoHomeworkRow[]).forEach((h) => {
        if (!h.student_id) return;
        if (!latest.has(h.student_id)) latest.set(h.student_id, h);
      });

      linked.forEach((heycleoId, crmId) => {
        const hw = latest.get(heycleoId);
        if (!hw) return;
        result[crmId] = {
          state: hw.completed ? 'completed' : hw.started ? 'started' : 'not_started',
          title: hw.title,
          dueDate: hw.due_date,
          marksAwarded: hw.marks_awarded != null ? Number(hw.marks_awarded) : null,
          marksAvailable: hw.marks_available != null ? Number(hw.marks_available) : null,
          percentage: hw.percentage != null ? Number(hw.percentage) : null,
        };
      });

      return { statuses: result, links };
    },
  });

  const statuses = query.data?.statuses ?? {};
  const links = query.data?.links ?? {};
  const values = Object.values(statuses);
  const withData = values.filter((s) => s.state !== 'no_data');
  const completed = withData.filter((s) => s.state === 'completed').length;

  return {
    statuses,
    links,
    summary: withData.length ? { completed, total: withData.length } : null,
    isLoading: query.isLoading,
  };
}
