import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type SyncState = {
  resource: string;
  last_server_time: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  rows_synced: number | null;
};

const fmt = (value?: string | null, pattern = 'd MMM yyyy, HH:mm') => {
  if (!value) return '—';
  try {
    return format(new Date(value), pattern);
  } catch {
    return '—';
  }
};

const gradeLabel = (grade: unknown) => {
  if (grade === null || grade === undefined) return '—';
  if (typeof grade === 'string' || typeof grade === 'number') return String(grade);
  if (typeof grade === 'object') {
    const record = grade as Record<string, unknown>;
    const value = record.grade ?? record.value ?? record.label;
    if (value !== undefined) return String(value);
    return JSON.stringify(grade);
  }
  return '—';
};

const statusVariant = (status?: string | null) => {
  const s = (status || '').toLowerCase();
  if (s.includes('complete') || s.includes('submitted') || s.includes('marked')) return 'default' as const;
  if (s.includes('overdue') || s.includes('missed')) return 'destructive' as const;
  return 'secondary' as const;
};

const HeyCleoData: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const [homeworkSearch, setHomeworkSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: syncState = [] } = useQuery({
    queryKey: ['heycleo-sync-state'],
    queryFn: async () => {
      const { data, error } = await supabase.from('heycleo_sync_state').select('*');
      if (error) throw error;
      return (data ?? []) as SyncState[];
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['heycleo-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('heycleo_students')
        .select('*')
        .order('last_name', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: homework = [], isLoading: homeworkLoading } = useQuery({
    queryKey: ['heycleo-homework'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('heycleo_homework_completion')
        .select('*')
        .order('due_date', { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      map.set(s.student_id, `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || s.student_id);
    });
    return map;
  }, [students]);

  const syncMutation = useMutation({
    mutationFn: async (resource: 'all' | 'students' | 'homework-completion') => {
      const { data, error } = await supabase.functions.invoke('heycleo-pull', { body: { resource } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const results = (data?.results ?? []) as { resource: string; rows: number; status: string; error?: string }[];
      const failed = results.filter((r) => r.status === 'error');
      if (failed.length) {
        toast({
          title: 'Sync finished with errors',
          description: failed.map((f) => `${f.resource}: ${f.error}`).join(' | '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync complete',
          description: results.map((r) => `${r.resource}: ${r.rows} rows`).join(' · ') || 'No changes',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['heycleo-students'] });
      queryClient.invalidateQueries({ queryKey: ['heycleo-homework'] });
      queryClient.invalidateQueries({ queryKey: ['heycleo-sync-state'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    },
  });

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.first_name, s.last_name, s.email, s.year_group, s.education_level]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [students, studentSearch]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    homework.forEach((h) => h.status && set.add(h.status));
    return Array.from(set).sort();
  }, [homework]);

  const filteredHomework = useMemo(() => {
    const q = homeworkSearch.trim().toLowerCase();
    return homework.filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (!q) return true;
      const studentName = studentNameById.get(h.student_id ?? '') ?? '';
      return [h.title, h.subject, h.year_group, h.assessment_type, studentName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [homework, homeworkSearch, statusFilter, studentNameById]);

  const stateFor = (resource: string) => syncState.find((s) => s.resource === resource);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HeyCleo Data</h1>
          <p className="text-sm text-muted-foreground">
            Read-only sync of live-tuition students and their homework completion from HeyCleo.
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate('all')} disabled={syncMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {['students', 'homework-completion'].map((resource) => {
          const state = stateFor(resource);
          return (
            <Card key={resource}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {resource === 'students' ? 'Students' : 'Homework completion'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>Last run: {fmt(state?.last_run_at)}</div>
                <div>Rows last sync: {state?.rows_synced ?? 0}</div>
                <div className="flex items-center gap-2">
                  Status:
                  <Badge variant={state?.last_status === 'error' ? 'destructive' : 'secondary'}>
                    {state?.last_status ?? 'never run'}
                  </Badge>
                </div>
                {state?.last_error && (
                  <div className="text-destructive text-xs break-words">{state.last_error}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="homework">Homework Completion ({homework.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, year group…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Year group</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Working</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Synced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsLoading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">Loading…</TableCell></TableRow>
                  )}
                  {!studentsLoading && filteredStudents.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No students synced yet.</TableCell></TableRow>
                  )}
                  {filteredStudents.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium">{`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || '—'}</TableCell>
                      <TableCell>{s.email ?? '—'}</TableCell>
                      <TableCell>{s.year_group ?? '—'}</TableCell>
                      <TableCell>{s.education_level ?? '—'}</TableCell>
                      <TableCell>{[s.exam_month, s.exam_year].filter(Boolean).join(' ') || '—'}</TableCell>
                      <TableCell>{gradeLabel(s.working_grade)}</TableCell>
                      <TableCell>{gradeLabel(s.target_grade)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(s.synced_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search student, title, subject…"
                value={homeworkSearch}
                onChange={(e) => setHomeworkSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              {statuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homeworkLoading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">Loading…</TableCell></TableRow>
                  )}
                  {!homeworkLoading && filteredHomework.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No homework synced yet.</TableCell></TableRow>
                  )}
                  {filteredHomework.map((h) => (
                    <TableRow key={h.assignment_id}>
                      <TableCell className="font-medium">
                        {studentNameById.get(h.student_id ?? '') ?? '—'}
                      </TableCell>
                      <TableCell>{h.title ?? '—'}</TableCell>
                      <TableCell>{h.subject ?? '—'}</TableCell>
                      <TableCell>{fmt(h.due_date, 'd MMM yyyy')}</TableCell>
                      <TableCell><Badge variant={statusVariant(h.status)}>{h.status ?? 'unknown'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {h.completed ? 'Completed' : h.started ? 'Started' : 'Not started'}
                      </TableCell>
                      <TableCell>
                        {h.marks_available != null ? `${h.marks_awarded ?? 0}/${h.marks_available}` : '—'}
                      </TableCell>
                      <TableCell>{h.percentage != null ? `${Math.round(Number(h.percentage))}%` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeyCleoData;
