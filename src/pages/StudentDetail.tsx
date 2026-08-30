import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { Loader2 } from 'lucide-react';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { supabase } from '@/integrations/supabase/client';
import { useStudentWeeklyTopics } from '@/hooks/useStudentWeeklyTopics';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LoadingHand from '@/components/ui/loading-hand';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleArrowLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M19.2 11.8c-4.7.4-9.4.5-14.1.3" />
    <path d="M9.8 7.3C8 8.8 6.4 10.3 5 12c1.5 1.6 3.1 3.1 4.9 4.5" />
  </svg>
);

const DoodleChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M14.2 5.6c-2.6 1.9-5 4.1-7 6.5 2.1 2.3 4.4 4.4 6.9 6.2" />
  </svg>
);

const DoodleChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M9.8 5.6c2.6 1.9 5 4.1 7 6.5-2.1 2.3-4.4 4.4-6.9 6.2" />
  </svg>
);

const DoodleBook: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M5 5.4c2.4-.9 4.7-.9 7 .3v12.9c-2.3-1.2-4.6-1.2-7-.3z" />
    <path d="M19 5.4c-2.4-.9-4.7-.9-7 .3v12.9c2.3-1.2 4.6-1.2 7-.3z" />
  </svg>
);

const DoodleSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.5 12.1 19 5.2c.5-.2 1 .3.8.8l-6.6 14.5c-.2.5-.9.5-1.1 0l-2.3-5.4c-.1-.2-.3-.4-.5-.5l-5.3-2.3c-.5-.3-.4-1.1.1-1.2z" />
    <path d="m13 13.5 5.8-6.9" />
  </svg>
);

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

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

const chip = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-foreground';

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
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => navigate('/students-list')}
                className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-foreground bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                <DoodleArrowLeft className="h-4 w-4" />
                Back to students
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pastel-lilac text-sm font-bold text-foreground">
                  {initialsOf(studentName)}
                </span>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {studentName}
                </h1>
                {totalLessons > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-pastel-mint px-3 py-1 text-xs font-semibold text-foreground">
                    {totalLessons} lesson{totalLessons === 1 ? '' : 's'} this week
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Weekly topics covered, grouped by subject
              </p>
            </div>

            {/* Week navigator */}
            <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous week"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-foreground transition-colors hover:bg-foreground/[0.04]"
                >
                  <DoodleChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-[220px] text-center text-sm font-semibold text-foreground">
                  {formatRange(weekStart, weekEnd)}
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next week"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-foreground transition-colors hover:bg-foreground/[0.04]"
                >
                  <DoodleChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {missedCount > 0 && (
                  <span className={cn(chip, 'bg-pastel-butter')}>{missedCount} missed</span>
                )}
                {cancelledCount > 0 && (
                  <span className={cn(chip, 'bg-pastel-sand')}>{cancelledCount} cancelled</span>
                )}
                <button
                  type="button"
                  onClick={goThisWeek}
                  className="rounded-full border-2 border-foreground bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
                >
                  This week
                </button>
                {canSync && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DoodleSend className="h-4 w-4" />
                    )}
                    Sync to HeyCleo
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="mt-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-16">
                  <LoadingHand />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
                  <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  <p className="text-sm text-muted-foreground">No lessons this week.</p>
                </div>
              ) : (
                groups.map((g, gi) => (
                  <div
                    key={g.subject}
                    className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-foreground',
                          gi % 2 === 0 ? 'bg-pastel-sky' : 'bg-pastel-lilac'
                        )}
                      >
                        <DoodleBook className="h-5 w-5" />
                      </span>
                      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        {g.subject}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-pastel-sand px-3 py-1 text-xs font-semibold text-foreground">
                        {g.lessons.length}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {g.lessons.map((l) => (
                        <div
                          key={l.lessonId}
                          className="rounded-[1.25rem] bg-pastel-sand/40 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatLessonDate(l.startTime)}
                            </span>
                            <span className="font-semibold text-foreground">{l.title}</span>
                            {l.wasLate && (
                              <span className={cn(chip, 'bg-pastel-butter')}>
                                Joined late — partial data
                              </span>
                            )}
                            {!l.wasLate && l.confidenceScore !== null && (() => {
                              const raw = l.confidenceScore as number;
                              const pct = Math.round(raw * 10);
                              const tone =
                                pct >= 70
                                  ? 'bg-pastel-mint'
                                  : pct >= 40
                                  ? 'bg-pastel-butter'
                                  : 'bg-pastel-blush';
                              return (
                                <span className={cn(chip, tone)}>
                                  Understanding: {pct}% ({raw}/10)
                                  {l.engagementLevel ? ` · ${l.engagementLevel} engagement` : ''}
                                </span>
                              );
                            })()}
                            {!l.wasLate && l.confidenceScore === null && l.engagementLevel && (
                              <span className={cn(chip, 'bg-pastel-sky')}>
                                {l.engagementLevel} engagement
                              </span>
                            )}
                          </div>
                          {l.topics.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {l.topics.map((t, i) => (
                                <span
                                  key={`${l.lessonId}-${i}`}
                                  className="inline-flex items-center rounded-full bg-pastel-lilac/70 px-2.5 py-0.5 text-xs font-medium text-foreground"
                                >
                                  {t}
                                </span>
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
                            <div className="mt-3 rounded-[1rem] bg-pastel-mint/50 p-3">
                              <div className="mb-1.5 text-xs font-bold text-foreground">
                                Homework brief (internal)
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-xs">
                                {l.homeworkBrief.subject && (
                                  <span className="inline-flex items-center rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
                                    Subject: {l.homeworkBrief.subject}
                                  </span>
                                )}
                                {l.homeworkBrief.year_group && (
                                  <span className="inline-flex items-center rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
                                    Year: {l.homeworkBrief.year_group}
                                  </span>
                                )}
                                {l.homeworkBrief.difficulty_tag && (
                                  <span
                                    className={cn(
                                      chip,
                                      l.homeworkBrief.difficulty_tag === '1'
                                        ? 'bg-pastel-blush'
                                        : 'bg-pastel-butter'
                                    )}
                                  >
                                    Difficulty {l.homeworkBrief.difficulty_tag} —{' '}
                                    {l.homeworkBrief.difficulty_tag === '1'
                                      ? 'Not understanding'
                                      : 'Partial understanding'}
                                  </span>
                                )}
                              </div>
                              {Array.isArray(l.homeworkBrief.topics) && l.homeworkBrief.topics.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {l.homeworkBrief.topics.map((t, i) => (
                                    <span
                                      key={`hb-${l.lessonId}-${i}`}
                                      className="inline-flex items-center rounded-full bg-pastel-lilac/70 px-2.5 py-0.5 text-xs font-medium text-foreground"
                                    >
                                      {t}
                                    </span>
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
                    </div>
                  </div>
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
