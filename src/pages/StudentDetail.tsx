import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, BookOpen, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentWeeklyTopics } from '@/hooks/useStudentWeeklyTopics';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatRange = (start: Date, end: Date) => {
  const s = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const eDate = new Date(end);
  eDate.setDate(eDate.getDate() - 1);
  const e = eDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
};

const formatLessonDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentName, setStudentName] = useState<string>('Student');
  const [isSyncing, setIsSyncing] = useState(false);
  const { userRole } = useAuth();
  const canSync = userRole === 'owner' || userRole === 'admin';

  const { groups, missedCount, cancelledCount, isLoading, weekStart, weekEnd, goPrev, goNext, goThisWeek } =
    useStudentWeeklyTopics(studentId);

  const handleSync = async () => {
    if (!studentId) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-homework-sync', {
        body: {
          week_start: toIsoDate(weekStart),
          student_ids: [Number(studentId)],
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const failed = (data as any)?.failed ?? 0;
      const skipped = (data as any)?.skipped ?? 0;
      if (sent > 0) {
        toast.success(`HeyCleo sync sent for ${studentName}`);
      } else if (failed > 0) {
        toast.error(`HeyCleo sync failed (${failed})`);
      } else {
        toast(`No homework briefs to sync this week (skipped ${skipped})`);
      }
    } catch (err: any) {
      console.error('Weekly homework sync failed', err);
      toast.error(err?.message || 'Failed to sync weekly homework');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', Number(studentId))
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStudentName(`${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || 'Student');
      });
  }, [studentId]);

  const totalLessons = groups.reduce((n, g) => n + g.lessons.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/students-list')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to students
            </Button>

            <PageTitle
              title={studentName}
              subtitle="Weekly topics covered, grouped by subject"
            />

            {/* Week navigator */}
            <Card className="mt-6">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goPrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium min-w-[220px] text-center">
                    {formatRange(weekStart, weekEnd)}
                  </div>
                  <Button variant="outline" size="sm" onClick={goNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {totalLessons} lesson{totalLessons === 1 ? '' : 's'} this week
                  </span>
                  {missedCount > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                      {missedCount} missed
                    </Badge>
                  )}
                  {cancelledCount > 0 && (
                    <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
                      {cancelledCount} cancelled
                    </Badge>
                  )}
                  <Button variant="secondary" size="sm" onClick={goThisWeek}>
                    This week
                  </Button>
                  {canSync && (
                    <Button size="sm" onClick={handleSync} disabled={isSyncing}>
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Sync to HeyCleo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <div className="mt-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No lessons this week.
                  </CardContent>
                </Card>
              ) : (
                groups.map((g) => (
                  <Card key={g.subject}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5" />
                        {g.subject}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({g.lessons.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {g.lessons.map((l) => (
                        <div
                          key={l.lessonId}
                          className="border-l-2 border-primary/30 pl-4 py-1"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatLessonDate(l.startTime)}
                            </span>
                            <span className="font-medium">{l.title}</span>
                            {l.wasLate && (
                              <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                                Joined late — partial data
                              </Badge>
                            )}
                            {!l.wasLate && l.confidenceScore !== null && (() => {
                              const raw = l.confidenceScore as number;
                              const pct = Math.round(raw * 10);
                              const colour =
                                pct >= 70
                                  ? 'border-green-500 text-green-700 dark:text-green-400'
                                  : pct >= 40
                                  ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                                  : 'border-red-500 text-red-700 dark:text-red-400';
                              return (
                                <Badge variant="outline" className={colour}>
                                  Understanding: {pct}% ({raw}/10)
                                  {l.engagementLevel ? ` · ${l.engagementLevel} engagement` : ''}
                                </Badge>
                              );
                            })()}
                            {!l.wasLate && l.confidenceScore === null && l.engagementLevel && (
                              <Badge variant="outline">{l.engagementLevel} engagement</Badge>
                            )}
                          </div>
                          {l.topics.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {l.topics.map((t, i) => (
                                <Badge key={`${l.lessonId}-${i}`} variant="secondary">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              {l.hasSummary
                                ? 'No topics recorded for this lesson.'
                                : 'Topics pending — transcript still processing.'}
                            </p>
                          )}
                          {l.homeworkBrief ? (
                            <div className="mt-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
                              <div className="text-xs font-semibold text-primary mb-1.5">
                                Homework brief (internal)
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-xs">
                                {l.homeworkBrief.subject && (
                                  <Badge variant="outline">Subject: {l.homeworkBrief.subject}</Badge>
                                )}
                                {l.homeworkBrief.year_group && (
                                  <Badge variant="outline">Year: {l.homeworkBrief.year_group}</Badge>
                                )}
                                {l.homeworkBrief.difficulty_tag && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      l.homeworkBrief.difficulty_tag === '1'
                                        ? 'border-red-500 text-red-700 dark:text-red-400'
                                        : 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                                    }
                                  >
                                    Difficulty {l.homeworkBrief.difficulty_tag} —{' '}
                                    {l.homeworkBrief.difficulty_tag === '1'
                                      ? 'Not understanding'
                                      : 'Partial understanding'}
                                  </Badge>
                                )}
                              </div>
                              {Array.isArray(l.homeworkBrief.topics) && l.homeworkBrief.topics.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {l.homeworkBrief.topics.map((t, i) => (
                                    <Badge key={`hb-${l.lessonId}-${i}`} variant="secondary" className="text-xs">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs italic text-muted-foreground">
                              Homework brief not yet generated.
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
