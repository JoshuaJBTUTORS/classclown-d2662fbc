import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useHeyCleoStudents, HeyCleoStudentAggregate } from '@/hooks/useHeyCleoStudents';

type SyncState = {
  resource: string;
  last_server_time: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  rows_synced: number | null;
  rows_pruned: number | null;
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
    if (!Object.keys(record).length) return '—';
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

type SortKey = 'name' | 'completion' | 'overdue' | 'total' | 'activity';
type FilterKey = 'all' | 'overdue' | 'none' | 'not-crm';

const HeyCleoData: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { students, totals, isLoading } = useHeyCleoStudents();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('overdue');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailSubject, setDetailSubject] = useState<string>('all');

  const { data: syncState = [] } = useQuery({
    queryKey: ['heycleo-sync-state'],
    queryFn: async () => {
      const { data, error } = await supabase.from('heycleo_sync_state').select('*');
      if (error) throw error;
      return (data ?? []) as SyncState[];
    },
  });

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

  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = students.filter((s) => {
      if (filter === 'overdue' && s.overdueCount === 0) return false;
      if (filter === 'none' && s.total > 0) return false;
      if (filter === 'not-crm' && s.inCrm) return false;
      if (!q) return true;
      return [s.name, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'completion':
          return (b.completionRate ?? -1) - (a.completionRate ?? -1);
        case 'overdue':
          return b.overdueCount - a.overdueCount || b.total - a.total;
        case 'total':
          return b.total - a.total;
        case 'activity':
          return new Date(b.lastActivity ?? 0).getTime() - new Date(a.lastActivity ?? 0).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [students, search, filter, sortKey]);

  const selected: HeyCleoStudentAggregate | undefined = useMemo(
    () => students.find((s) => s.student_id === selectedId),
    [students, selectedId],
  );

  const detailSubjects = useMemo(() => {
    const set = new Set<string>();
    selected?.homework.forEach((h) => h.subject && set.add(h.subject));
    return Array.from(set).sort();
  }, [selected]);

  const detailHomework = useMemo(() => {
    if (!selected) return [];
    if (detailSubject === 'all') return selected.homework;
    return selected.homework.filter((h) => h.subject === detailSubject);
  }, [selected, detailSubject]);

  const openStudent = (id: string) => {
    setDetailSubject('all');
    setSelectedId(id);
  };

  const stateFor = (resource: string) => syncState.find((s) => s.resource === resource);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'overdue', label: `Has overdue (${totals.withOverdue})` },
    { key: 'none', label: 'No homework' },
    { key: 'not-crm', label: `Not in CRM (${totals.notInCrm})` },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'overdue', label: 'Overdue' },
    { key: 'completion', label: 'Completion' },
    { key: 'total', label: 'Volume' },
    { key: 'activity', label: 'Last activity' },
    { key: 'name', label: 'Name' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HeyCleo Data</h1>
          <p className="text-sm text-muted-foreground">
            Live-tuition students from HeyCleo with their homework rolled up per student.
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate('all')} disabled={syncMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Students</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{totals.studentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">With overdue homework</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{totals.withOverdue}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall completion</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{totals.completionRate}%</div>
            <Progress value={totals.completionRate} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Last sync</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            {['students', 'homework-completion'].map((resource) => {
              const state = stateFor(resource);
              return (
                <div key={resource} className="flex items-center justify-between gap-2">
                  <span className="capitalize">{resource === 'students' ? 'Students' : 'Homework'}</span>
                  <span className="flex items-center gap-2">
                    {fmt(state?.last_run_at, 'd MMM, HH:mm')}
                    <Badge variant={state?.last_status === 'error' ? 'destructive' : 'secondary'}>
                      {state?.last_status ?? 'never'}
                    </Badge>
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students ({totals.studentCount})</TabsTrigger>
          <TabsTrigger value="homework">Homework ({totals.homeworkCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? 'default' : 'outline'}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort by:
            {sorts.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={sortKey === s.key ? 'secondary' : 'ghost'}
                onClick={() => setSortKey(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead className="text-center">Homework</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="w-40">Completion</TableHead>
                    <TableHead className="text-center">Overdue</TableHead>
                    <TableHead className="text-center">Avg score</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead>Live since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">Loading…</TableCell></TableRow>
                  )}
                  {!isLoading && visibleStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No students match these filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleStudents.map((s) => (
                    <TableRow
                      key={s.student_id}
                      className="cursor-pointer"
                      onClick={() => openStudent(s.student_id)}
                    >
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email ?? '—'}</div>
                      </TableCell>
                      <TableCell>
                        {s.inCrm ? (
                          <Badge variant="secondary">Matched</Badge>
                        ) : (
                          <Badge variant="outline">Not in CRM</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{s.total}</TableCell>
                      <TableCell className="text-center">{s.completedCount}</TableCell>
                      <TableCell>
                        {s.completionRate === null ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress value={s.completionRate} className="h-2" />
                            <span className="text-xs tabular-nums">{s.completionRate}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.overdueCount > 0 ? (
                          <Badge variant="destructive">{s.overdueCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{s.avgScore != null ? `${s.avgScore}%` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(s.lastActivity, 'd MMM yyyy')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(s.live_tuition_since, 'd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="space-y-4">
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
                  {isLoading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">Loading…</TableCell></TableRow>
                  )}
                  {students.flatMap((s) =>
                    s.homework.map((h) => (
                      <TableRow key={h.assignment_id} className="cursor-pointer" onClick={() => openStudent(s.student_id)}>
                        <TableCell className="font-medium">{s.name}</TableCell>
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
                    )),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.email ?? 'No email on record'}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">Year group</div>{selected.year_group ?? '—'}</div>
                <div><div className="text-xs text-muted-foreground">Level</div>{selected.education_level ?? '—'}</div>
                <div><div className="text-xs text-muted-foreground">Exam</div>{[selected.exam_month, selected.exam_year].filter(Boolean).join(' ') || '—'}</div>
                <div><div className="text-xs text-muted-foreground">Working grade</div>{gradeLabel(selected.working_grade)}</div>
                <div><div className="text-xs text-muted-foreground">Target grade</div>{gradeLabel(selected.target_grade)}</div>
                <div><div className="text-xs text-muted-foreground">Live since</div>{fmt(selected.live_tuition_since, 'd MMM yyyy')}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Assigned', value: selected.total },
                  { label: 'Completed', value: selected.completedCount },
                  { label: 'Overdue', value: selected.overdueCount },
                  { label: 'Avg score', value: selected.avgScore != null ? `${selected.avgScore}%` : '—' },
                ].map((tile) => (
                  <Card key={tile.label}>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{tile.label}</div>
                      <div className="text-lg font-semibold">{tile.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {detailSubjects.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant={detailSubject === 'all' ? 'default' : 'outline'} onClick={() => setDetailSubject('all')}>
                    All subjects
                  </Button>
                  {detailSubjects.map((subject) => (
                    <Button
                      key={subject}
                      size="sm"
                      variant={detailSubject === subject ? 'default' : 'outline'}
                      onClick={() => setDetailSubject(subject)}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailHomework.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No homework synced for this student.</TableCell></TableRow>
                    )}
                    {detailHomework.map((h) => (
                      <TableRow key={h.assignment_id}>
                        <TableCell>
                          <div className="font-medium">{h.title ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{h.assessment_type ?? ''}</div>
                        </TableCell>
                        <TableCell>{h.subject ?? '—'}</TableCell>
                        <TableCell className="text-xs">{fmt(h.due_date, 'd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(h.status)}>
                            {h.completed ? 'Completed' : h.started ? 'Started' : h.status ?? 'Not started'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {h.marks_available != null
                            ? `${h.marks_awarded ?? 0}/${h.marks_available}${h.percentage != null ? ` (${Math.round(Number(h.percentage))}%)` : ''}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HeyCleoData;
