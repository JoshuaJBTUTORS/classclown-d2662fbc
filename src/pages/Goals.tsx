import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar as CalendarIcon, GraduationCap } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const TRIAL_GOAL = 1500;
const LESSONS_GOAL = 2000;

// Fixed campaign window
const GOAL_START = new Date('2026-07-25T00:00:00Z');
const GOAL_DEADLINE = new Date('2026-12-31T23:59:59Z');

// December 2026 window is no longer used — we show all currently-scheduled
// upcoming regular lessons as progress toward the target.


type Status = 'achieved' | 'on-track' | 'behind' | 'not-achieved';

const statusLabel: Record<Status, string> = {
  'achieved': 'Achieved',
  'on-track': 'On track',
  'behind': 'Behind',
  'not-achieved': 'Not achieved',
};

const statusClass: Record<Status, string> = {
  'achieved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'on-track': 'bg-teal-100 text-teal-700 border-teal-200',
  'behind': 'bg-amber-100 text-amber-700 border-amber-200',
  'not-achieved': 'bg-rose-100 text-rose-700 border-rose-200',
};

function computeStatus(current: number, target: number): Status {
  if (current >= target) return 'achieved';
  const now = new Date();
  if (now > GOAL_DEADLINE) return 'not-achieved';
  if (now < GOAL_START) return 'on-track';
  const total = GOAL_DEADLINE.getTime() - GOAL_START.getTime();
  const elapsed = now.getTime() - GOAL_START.getTime();
  const expected = target * (elapsed / total);
  return current < 0.9 * expected ? 'behind' : 'on-track';
}

interface GoalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  loading: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ title, description, icon, current, target, loading }) => {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const status = computeStatus(current, target);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-primary">
              {loading ? '—' : current.toLocaleString()}
              <span className="text-base text-muted-foreground font-medium"> / {target.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{loading ? ' ' : `${pct}% of goal`}</div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <Progress value={pct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining.toLocaleString()} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Goals: React.FC = () => {
  const [trialCount, setTrialCount] = useState(0);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [trialsRes, lessonsRes] = await Promise.all([
          supabase
            .from('trial_bookings')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', GOAL_START.toISOString())
            .lte('created_at', GOAL_DEADLINE.toISOString()),
          supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .neq('lesson_type', 'trial')
            .gte('start_time', new Date().toISOString())
            .lte('start_time', GOAL_DEADLINE.toISOString()),

        ]);
        if (cancelled) return;
        if (trialsRes.error) console.error('Trials query error', trialsRes.error);
        if (lessonsRes.error) console.error('Lessons query error', lessonsRes.error);
        setTrialCount(trialsRes.count ?? 0);
        setLessonsCount(lessonsRes.count ?? 0);
      } catch (e) {
        console.error('Failed to load goals data', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, Math.ceil((GOAL_DEADLINE.getTime() - now.getTime()) / msPerDay));
  const deadlineLabel = GOAL_DEADLINE.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <PageTitle title="Team Goals" />
          <p className="text-muted-foreground mt-2">
            Targets to hit by {deadlineLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{daysLeft} days left</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalCard
          title="Trial Lessons Booked"
          description={`Collective bookings by ${deadlineLabel}`}
          icon={<CalendarIcon className="h-5 w-5" />}
          current={trialCount}
          target={TRIAL_GOAL}
          loading={loading}
        />
        <GoalCard
          title="Lessons Scheduled"
          description={`Upcoming regular lessons currently on the calendar (through ${deadlineLabel})`}

          icon={<GraduationCap className="h-5 w-5" />}
          current={lessonsCount}
          target={LESSONS_GOAL}
          loading={loading}
        />
      </div>

      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
        <Target className="h-3.5 w-3.5" />
        Targets: {TRIAL_GOAL.toLocaleString()} trial bookings · {LESSONS_GOAL.toLocaleString()} lessons scheduled in December 2026
      </div>
    </div>
  );
};

export default Goals;
