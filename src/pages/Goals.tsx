import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Calendar as CalendarIcon, GraduationCap, Users, FileCheck, UserPlus, Pencil, Check, X } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const TRIAL_GOAL = 1800;
const LESSONS_GOAL = 2500;
const AVG_GROUP_GOAL = 3.5;
const PROPOSALS_GOAL = 390;
const CUSTOMERS_GOAL = 500;
const CUSTOMERS_SETTING_KEY = 'customers_count';

// Fixed campaign window
const GOAL_START = new Date('2026-07-01T00:00:00Z');
const GOAL_DEADLINE = new Date('2027-01-31T23:59:59Z');

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
  decimals?: number;
  remainingLabel?: (remaining: number) => string;
}

const GoalCard: React.FC<GoalCardProps> = ({ title, description, icon, current, target, loading, decimals = 0, remainingLabel }) => {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const status = computeStatus(current, target);
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : n.toLocaleString();

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
              {loading ? '—' : fmt(current)}
              <span className="text-base text-muted-foreground font-medium"> / {fmt(target)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{loading ? ' ' : `${pct}% of goal`}</div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <Progress value={pct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remainingLabel ? remainingLabel(remaining) : `${fmt(remaining)} remaining`}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Goals: React.FC = () => {
  const { isOwner } = useAuth();
  const [trialCount, setTrialCount] = useState(0);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [avgGroupSize, setAvgGroupSize] = useState(0);
  const [groupLessonCount, setGroupLessonCount] = useState(0);
  const [proposalCount, setProposalCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [editingCustomers, setEditingCustomers] = useState(false);
  const [customersDraft, setCustomersDraft] = useState('0');
  const [savingCustomers, setSavingCustomers] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const currentMonthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999), [now]);
  const currentMonthLabel = now.toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [trialsRes, lessonsRes, groupRes, proposalsRes, customersRes] = await Promise.all([
          supabase
            .from('trial_bookings')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', GOAL_START.toISOString())
            .lte('created_at', GOAL_DEADLINE.toISOString()),
          supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .neq('lesson_type', 'trial')
            .gte('start_time', currentMonthStart.toISOString())
            .lte('start_time', currentMonthEnd.toISOString()),
          supabase
            .from('lessons')
            .select('id, lesson_students(student_id)')
            .eq('is_group', true)
            .neq('lesson_type', 'trial')
            .gte('start_time', currentMonthStart.toISOString())
            .lte('start_time', currentMonthEnd.toISOString()),
          supabase
            .from('lesson_proposals')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('completed_at', GOAL_START.toISOString())
            .lte('completed_at', GOAL_DEADLINE.toISOString()),
          supabase
            .from('app_settings')
            .select('value')
            .eq('key', CUSTOMERS_SETTING_KEY)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (trialsRes.error) console.error('Trials query error', trialsRes.error);
        if (lessonsRes.error) console.error('Lessons query error', lessonsRes.error);
        if (groupRes.error) console.error('Group lessons query error', groupRes.error);
        if (proposalsRes.error) console.error('Proposals query error', proposalsRes.error);
        setTrialCount(trialsRes.count ?? 0);
        setLessonsCount(lessonsRes.count ?? 0);
        const groups = groupRes.data ?? [];
        const totalStudents = groups.reduce((sum: number, l: any) => sum + (l.lesson_students?.length || 0), 0);
        setGroupLessonCount(groups.length);
        setAvgGroupSize(groups.length > 0 ? totalStudents / groups.length : 0);
        setProposalCount(proposalsRes.count ?? 0);
        const cVal = parseInt((customersRes.data as any)?.value ?? '0', 10);
        const c = Number.isFinite(cVal) ? cVal : 0;
        setCustomersCount(c);
        setCustomersDraft(String(c));
      } catch (e) {
        console.error('Failed to load goals data', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [currentMonthStart, currentMonthEnd]);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, Math.ceil((GOAL_DEADLINE.getTime() - now.getTime()) / msPerDay));
  const deadlineLabel = GOAL_DEADLINE.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const saveCustomers = async () => {
    const parsed = parseInt(customersDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast({ title: 'Invalid number', description: 'Enter a non-negative integer.', variant: 'destructive' });
      return;
    }
    setSavingCustomers(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: CUSTOMERS_SETTING_KEY, value: String(parsed) }, { onConflict: 'key' });
    setSavingCustomers(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    setCustomersCount(parsed);
    setEditingCustomers(false);
    toast({ title: 'Updated', description: 'Customer count saved.' });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          description={`Regular lessons scheduled in ${currentMonthLabel}`}
          icon={<GraduationCap className="h-5 w-5" />}
          current={lessonsCount}
          target={LESSONS_GOAL}
          loading={loading}
        />
        <GoalCard
          title="Avg Students per Group"
          description={`Across ${groupLessonCount.toLocaleString()} group lessons in ${currentMonthLabel}`}
          icon={<Users className="h-5 w-5" />}
          current={avgGroupSize}
          target={AVG_GROUP_GOAL}
          loading={loading}
          decimals={2}
          remainingLabel={(r) => r > 0 ? `${r.toFixed(2)} to reach target avg` : 'Target avg reached'}
        />
        <GoalCard
          title="Proposals Completed"
          description={`Collective proposals completed by ${deadlineLabel}`}
          icon={<FileCheck className="h-5 w-5" />}
          current={proposalCount}
          target={PROPOSALS_GOAL}
          loading={loading}
        />
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Number of Customers</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total active customers by {deadlineLabel}
              </p>
            </div>
            <div className="text-muted-foreground"><UserPlus className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                {editingCustomers ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={customersDraft}
                      onChange={(e) => setCustomersDraft(e.target.value)}
                      className="h-9 w-28"
                    />
                    <Button size="sm" onClick={saveCustomers} disabled={savingCustomers}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingCustomers(false); setCustomersDraft(String(customersCount)); }} disabled={savingCustomers}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    {loading ? '—' : customersCount.toLocaleString()}
                    <span className="text-base text-muted-foreground font-medium"> / {CUSTOMERS_GOAL.toLocaleString()}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {loading ? ' ' : `${Math.min(100, Math.round((customersCount / CUSTOMERS_GOAL) * 100))}% of goal`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[computeStatus(customersCount, CUSTOMERS_GOAL)])}>
                  {statusLabel[computeStatus(customersCount, CUSTOMERS_GOAL)]}
                </span>
                {isOwner && !editingCustomers && (
                  <Button size="sm" variant="outline" onClick={() => setEditingCustomers(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <Progress value={Math.min(100, Math.round((customersCount / CUSTOMERS_GOAL) * 100))} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.max(0, CUSTOMERS_GOAL - customersCount).toLocaleString()} remaining</span>
              {!isOwner && <span className="italic">Owner-only edit</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
        <Target className="h-3.5 w-3.5" />
        Targets: {TRIAL_GOAL.toLocaleString()} trial bookings · {LESSONS_GOAL.toLocaleString()} lessons scheduled · avg {AVG_GROUP_GOAL} students per group in {currentMonthLabel} · {PROPOSALS_GOAL.toLocaleString()} proposals completed · {CUSTOMERS_GOAL.toLocaleString()} customers
      </div>
    </div>
  );
};

export default Goals;
