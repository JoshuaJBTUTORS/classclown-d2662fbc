import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HeyCleoHomeworkRow = {
  assignment_id: string;
  homework_id: string | null;
  student_id: string | null;
  title: string | null;
  subject: string | null;
  year_group: string | null;
  assessment_type: string | null;
  tutor_id: string | null;
  due_date: string | null;
  status: string | null;
  started: boolean | null;
  completed: boolean | null;
  assigned_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  marks_awarded: number | null;
  marks_available: number | null;
  percentage: number | null;
  synced_at: string | null;
};

export type HeyCleoStudentRow = {
  student_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  year_group: string | null;
  education_level: string | null;
  exam_year: number | null;
  exam_month: string | null;
  working_grade: unknown;
  target_grade: unknown;
  live_tuition_since: string | null;
  synced_at: string | null;
};

export type HeyCleoStudentAggregate = HeyCleoStudentRow & {
  name: string;
  inCrm: boolean;
  crmLabel: string | null;
  total: number;
  completedCount: number;
  startedCount: number;
  overdueCount: number;
  completionRate: number | null;
  avgScore: number | null;
  lastActivity: string | null;
  homework: HeyCleoHomeworkRow[];
};

async function fetchAll<T>(table: string, orderCol: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from(table as never)
      .select('*')
      .order(orderCol, { ascending: true, nullsFirst: false })
      .range(page * size, page * size + size - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export function useHeyCleoStudents() {
  const studentsQuery = useQuery({
    queryKey: ['heycleo-students'],
    queryFn: () => fetchAll<HeyCleoStudentRow>('heycleo_students', 'student_id'),
  });

  const homeworkQuery = useQuery({
    queryKey: ['heycleo-homework'],
    queryFn: () => fetchAll<HeyCleoHomeworkRow>('heycleo_homework_completion', 'assignment_id'),
  });

  const crmQuery = useQuery({
    queryKey: ['heycleo-crm-emails'],
    queryFn: async () => {
      const [students, parents] = await Promise.all([
        supabase.from('students').select('email, first_name, last_name').limit(5000),
        supabase.from('parents').select('email, first_name, last_name').limit(5000),
      ]);
      const map = new Map<string, string>();
      (students.data ?? []).forEach((s) => {
        if (s.email) map.set(s.email.toLowerCase().trim(), `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim());
      });
      (parents.data ?? []).forEach((p) => {
        const key = p.email?.toLowerCase().trim();
        if (key && !map.has(key)) map.set(key, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim());
      });
      return map;
    },
  });

  const students = useMemo<HeyCleoStudentAggregate[]>(() => {
    const list = studentsQuery.data ?? [];
    const homework = homeworkQuery.data ?? [];
    const crm = crmQuery.data ?? new Map<string, string>();

    const byStudent = new Map<string, HeyCleoHomeworkRow[]>();
    homework.forEach((h) => {
      if (!h.student_id) return;
      const arr = byStudent.get(h.student_id);
      if (arr) arr.push(h);
      else byStudent.set(h.student_id, [h]);
    });

    const now = Date.now();

    return list.map((s) => {
      const hw = (byStudent.get(s.student_id) ?? []).sort((a, b) => {
        const da = new Date(a.due_date ?? a.assigned_at ?? 0).getTime();
        const db = new Date(b.due_date ?? b.assigned_at ?? 0).getTime();
        return db - da;
      });

      const total = hw.length;
      const completedCount = hw.filter((h) => h.completed).length;
      const startedCount = hw.filter((h) => h.started && !h.completed).length;
      const overdueCount = hw.filter(
        (h) => !h.completed && h.due_date && new Date(h.due_date).getTime() < now,
      ).length;

      const scored = hw.filter((h) => h.marks_available != null && Number(h.marks_available) > 0);
      const awarded = scored.reduce((sum, h) => sum + Number(h.marks_awarded ?? 0), 0);
      const available = scored.reduce((sum, h) => sum + Number(h.marks_available ?? 0), 0);

      const activityDates = hw
        .map((h) => h.submitted_at ?? h.started_at ?? h.assigned_at)
        .filter(Boolean)
        .map((d) => new Date(d as string).getTime())
        .filter((t) => !Number.isNaN(t));

      const emailKey = s.email?.toLowerCase().trim() ?? '';
      const crmLabel = emailKey ? crm.get(emailKey) ?? null : null;

      return {
        ...s,
        name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || s.student_id,
        inCrm: crmLabel !== null,
        crmLabel,
        total,
        completedCount,
        startedCount,
        overdueCount,
        completionRate: total ? Math.round((completedCount / total) * 100) : null,
        avgScore: available > 0 ? Math.round((awarded / available) * 100) : null,
        lastActivity: activityDates.length ? new Date(Math.max(...activityDates)).toISOString() : null,
        homework: hw,
      };
    });
  }, [studentsQuery.data, homeworkQuery.data, crmQuery.data]);

  const totals = useMemo(() => {
    const homework = homeworkQuery.data ?? [];
    const completed = homework.filter((h) => h.completed).length;
    return {
      studentCount: students.length,
      homeworkCount: homework.length,
      withOverdue: students.filter((s) => s.overdueCount > 0).length,
      notInCrm: students.filter((s) => !s.inCrm).length,
      completionRate: homework.length ? Math.round((completed / homework.length) * 100) : 0,
    };
  }, [students, homeworkQuery.data]);

  return {
    students,
    totals,
    isLoading: studentsQuery.isLoading || homeworkQuery.isLoading,
  };
}
