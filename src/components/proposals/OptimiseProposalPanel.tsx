import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkle, RefreshCw, X, Users, CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface OptimiseLessonTime {
  day: string;
  time: string;
  duration: number;
  subject: string;
}

interface Finding {
  index: number;
  slot?: string;
  status?: 'good' | 'better' | 'none' | string;
  headline?: string;
  detail?: string;
  suggestion?: { day?: string; time?: string; reason?: string } | null;
  group_match?: { day?: string; time?: string; title?: string; tutor?: string; students?: number } | null;
}

interface Props {
  lessonTimes: OptimiseLessonTime[];
  lessonType?: string;
  studentContext?: string;
}

const statusMeta: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  good: {
    label: 'Good as proposed',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  better: {
    label: 'Better option available',
    className: 'bg-amber-100 text-amber-900 border-amber-200',
    Icon: CalendarClock,
  },
  none: {
    label: 'No coverage found',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
    Icon: AlertTriangle,
  },
};

export default function OptimiseProposalPanel({ lessonTimes, lessonType, studentContext }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);

  const validTimes = lessonTimes.filter((lt) => lt.day && lt.time && lt.subject);
  const canRun = validTimes.length > 0;

  const runOptimiser = async () => {
    if (!canRun) return;
    setIsRunning(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-cleo-optimise-proposal', {
        body: {
          lessonTimes: validTimes,
          lessonType: lessonType || '',
          studentContext: studentContext || '',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSummary(data?.summary || '');
      setFindings(Array.isArray(data?.findings) ? data.findings : []);
    } catch (err: any) {
      console.error('Optimise with Cleo failed:', err);
      setFindings([]);
      setSummary('');
      setOpen(false);
      toast({
        title: 'Could not optimise',
        description: err?.message || 'Cleo could not check the calendar right now.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={runOptimiser}
        disabled={!canRun || isRunning}
        title={canRun ? undefined : 'Add a day, time and subject to at least one lesson first'}
      >
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkle className="mr-2 h-4 w-4" />}
        Optimise with Cleo Agent
      </Button>

      {open && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Cleo's calendar check</p>
                <p className="text-xs text-muted-foreground">
                  Suggestions only — nothing in your proposal has been changed.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={runOptimiser} disabled={isRunning}>
                  <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                  <span className="ml-1 hidden sm:inline">Re-run</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isRunning && (
              <p className="text-sm text-muted-foreground">
                Checking tutor availability, existing groups and slot coverage...
              </p>
            )}

            {!isRunning && summary && <p className="text-sm">{summary}</p>}

            {!isRunning && findings.length > 0 && (
              <div className="space-y-3">
                {findings.map((finding, i) => {
                  const meta = statusMeta[finding.status || ''] || statusMeta.better;
                  const proposed = validTimes[finding.index] ?? validTimes[i];
                  const label =
                    finding.slot ||
                    (proposed ? `${proposed.day} ${proposed.time} — ${proposed.subject}` : `Lesson ${i + 1}`);

                  return (
                    <div key={`${finding.index}-${i}`} className="rounded-lg border p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        <Badge variant="outline" className={meta.className}>
                          <meta.Icon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </div>

                      {finding.headline && <p className="text-sm font-medium">{finding.headline}</p>}
                      {finding.detail && <p className="text-sm text-muted-foreground">{finding.detail}</p>}

                      {finding.group_match && (
                        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2 text-sm">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>
                            Existing group: {finding.group_match.title || 'Group session'} —{' '}
                            {finding.group_match.day} {finding.group_match.time}
                            {finding.group_match.tutor ? ` with ${finding.group_match.tutor}` : ''}
                            {typeof finding.group_match.students === 'number'
                              ? ` (${finding.group_match.students} students)`
                              : ''}
                          </span>
                        </div>
                      )}

                      {finding.suggestion?.day && finding.suggestion?.time && (
                        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2 text-sm">
                          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>
                            Suggested instead: {finding.suggestion.day} {finding.suggestion.time}
                            {finding.suggestion.reason ? ` — ${finding.suggestion.reason}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isRunning && !findings.length && !summary && (
              <p className="text-sm text-muted-foreground">No findings returned.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
