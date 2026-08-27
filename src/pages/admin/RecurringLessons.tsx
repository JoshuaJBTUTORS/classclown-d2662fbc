import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Infinity as InfinityIcon, StopCircle, Trash2, RefreshCw } from 'lucide-react';

interface GroupRow {
  id: string;
  original_lesson_id: string;
  next_extension_date: string | null;
  instances_generated_until: string | null;
  is_infinite: boolean;
  total_instances_generated: number | null;
  lesson?: {
    title: string;
    subject: string | null;
    start_time: string;
    recurrence_interval: string | null;
    tutor?: { first_name: string; last_name: string } | null;
  } | null;
  upcoming_count?: number;
}

const RecurringLessons: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recurring_lesson_groups')
      .select(`
        id, original_lesson_id, next_extension_date, instances_generated_until,
        is_infinite, total_instances_generated,
        lesson:lessons!recurring_lesson_groups_original_lesson_id_fkey(
          title, subject, start_time, recurrence_interval,
          tutor:tutors(first_name, last_name)
        )
      `)
      .order('next_extension_date', { ascending: true });

    if (error) {
      console.error(error);
      toast.error('Failed to load recurring lessons');
      setLoading(false);
      return;
    }

    const rows = (data || []) as any as GroupRow[];

    // Count upcoming instances for each parent
    const nowIso = new Date().toISOString();
    await Promise.all(
      rows.map(async (r) => {
        const { count } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .or(`id.eq.${r.original_lesson_id},parent_lesson_id.eq.${r.original_lesson_id}`)
          .gte('start_time', nowIso);
        r.upcoming_count = count || 0;
      })
    );

    setGroups(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stopExtending = async (g: GroupRow) => {
    if (!confirm('Stop auto-extending this series? No future lessons will be created automatically.')) return;
    const { error } = await supabase
      .from('recurring_lesson_groups')
      .update({ is_infinite: false, instances_generated_until: new Date().toISOString() })
      .eq('id', g.id);
    if (error) {
      toast.error('Failed to stop extending');
    } else {
      toast.success('Series will no longer auto-extend');
      load();
    }
  };

  const extendNow = async (g: GroupRow) => {
    // Reset next_extension_date to now so the cron picks it up; also re-enable infinite
    const { error } = await supabase
      .from('recurring_lesson_groups')
      .update({
        is_infinite: true,
        next_extension_date: new Date().toISOString(),
        instances_generated_until: new Date().toISOString(),
      })
      .eq('id', g.id);
    if (error) {
      toast.error('Failed to schedule extension');
      return;
    }
    // Trigger immediately
    const { error: rpcErr } = await supabase.rpc('extend_recurring_lessons' as any);
    if (rpcErr) {
      toast.message('Scheduled for next run', { description: rpcErr.message });
    } else {
      toast.success('Extended by 3 months');
    }
    load();
  };

  const deleteSeries = async (g: GroupRow) => {
    if (!confirm('Delete the entire recurring series, including all past and future lessons?')) return;
    // Find all lesson ids
    const { data: instances } = await supabase
      .from('lessons')
      .select('id')
      .or(`id.eq.${g.original_lesson_id},parent_lesson_id.eq.${g.original_lesson_id}`);
    const ids = (instances || []).map((l: any) => l.id);
    if (ids.length) {
      await supabase.from('lessons').delete().in('id', ids);
    }
    await supabase.from('recurring_lesson_groups').delete().eq('id', g.id);
    await supabase.from('recurring_lesson_cancellations').delete().eq('parent_lesson_id', g.original_lesson_id);
    toast.success(`Series deleted (${ids.length} lessons)`);
    load();
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-8">
          <PageTitle
            title="Recurring Lessons"
            subtitle="Review which series are still auto-extending and stop or extend them as needed"
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Series ({groups.length})</span>
                <Button size="sm" variant="outline" onClick={load} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recurring series.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4">Lesson</th>
                        <th className="py-2 pr-4">Tutor</th>
                        <th className="py-2 pr-4">Cadence</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Generated until</th>
                        <th className="py-2 pr-4">Upcoming</th>
                        <th className="py-2 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((g) => (
                        <tr key={g.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium">{g.lesson?.title || '(deleted parent lesson)'}</div>
                            <div className="text-xs text-muted-foreground">{g.lesson?.subject}</div>
                          </td>
                          <td className="py-3 pr-4">
                            {g.lesson?.tutor
                              ? `${g.lesson.tutor.first_name} ${g.lesson.tutor.last_name}`
                              : '—'}
                          </td>
                          <td className="py-3 pr-4 capitalize">{g.lesson?.recurrence_interval || 'weekly'}</td>
                          <td className="py-3 pr-4">
                            {g.is_infinite ? (
                              <Badge variant="default" className="gap-1">
                                <InfinityIcon className="w-3 h-3" /> Auto-extending
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Stopped</Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-xs">
                            {g.instances_generated_until
                              ? format(new Date(g.instances_generated_until), 'd MMM yyyy')
                              : '—'}
                          </td>
                          <td className="py-3 pr-4">{g.upcoming_count ?? 0}</td>
                          <td className="py-3 pr-4 text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => extendNow(g)}>
                              Extend 3mo
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => stopExtending(g)}>
                              <StopCircle className="w-3 h-3 mr-1" /> Stop
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteSeries(g)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default RecurringLessons;
