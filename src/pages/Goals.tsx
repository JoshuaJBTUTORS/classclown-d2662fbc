import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTitle from '@/components/ui/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const TRIAL_GOAL = 1800;
const LESSONS_GOAL = 2500;
const AVG_GROUP_GOAL = 3.5;
const PROPOSALS_GOAL = 390;
const CUSTOMERS_GOAL = 400;
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

// Pastel, non-green status pills
const statusClass: Record<Status, string> = {
  'achieved': 'bg-violet-100 text-violet-700 border-violet-200',
  'on-track': 'bg-sky-100 text-sky-700 border-sky-200',
  'behind': 'bg-amber-100 text-amber-700 border-amber-200',
  'not-achieved': 'bg-rose-100 text-rose-700 border-rose-200',
};

// Pastel palette rotated across cards
const cardPalettes = [
  { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-500', bar: 'bg-pink-400' },
  { bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-500', bar: 'bg-sky-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-500', bar: 'bg-violet-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-500', bar: 'bg-amber-400' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-500', bar: 'bg-rose-400' },
];

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
  emoji: string;
  current: number;
  target: number;
  loading: boolean;
  decimals?: number;
  remainingLabel?: (remaining: number) => string;
  palette: typeof cardPalettes[number];
}

const GoalCard: React.FC<GoalCardProps> = ({ title, description, emoji, current, target, loading, decimals = 0, remainingLabel, palette }) => {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const status = computeStatus(current, target);
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : n.toLocaleString();

  return (
    <Card className={cn(palette.bg, palette.border, 'border')}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-2xl leading-none" aria-hidden>{emoji}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className={cn('text-3xl font-bold', palette.accent)}>
              {loading ? '—' : fmt(current)}
              <span className="text-base text-muted-foreground font-medium"> / {fmt(target)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{loading ? ' ' : `${pct}% of goal`}</div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', palette.bar)} style={{ width: `${pct}%` }} />
        </div>
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

  const customersPalette = cardPalettes[4];
  const customersPct = Math.min(100, Math.round((customersCount / CUSTOMERS_GOAL) * 100));

  // Presentation mode
  const presentRef = useRef<HTMLDivElement>(null);
  const [presenting, setPresenting] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const slides = useMemo(() => ([
    { title: 'Trial Lessons Booked', emoji: '🗓️', current: trialCount, target: TRIAL_GOAL, decimals: 0, sub: `by ${deadlineLabel}`, palette: cardPalettes[0] },
    { title: 'Lessons Scheduled', emoji: '🎓', current: lessonsCount, target: LESSONS_GOAL, decimals: 0, sub: currentMonthLabel, palette: cardPalettes[1] },
    { title: 'Avg Students per Group', emoji: '👯', current: avgGroupSize, target: AVG_GROUP_GOAL, decimals: 2, sub: currentMonthLabel, palette: cardPalettes[2] },
    { title: 'Proposals Completed', emoji: '📝', current: proposalCount, target: PROPOSALS_GOAL, decimals: 0, sub: `by ${deadlineLabel}`, palette: cardPalettes[3] },
    { title: 'Number of Customers', emoji: '🧑‍🤝‍🧑', current: customersCount, target: CUSTOMERS_GOAL, decimals: 0, sub: `by ${deadlineLabel}`, palette: cardPalettes[4] },
  ]), [trialCount, lessonsCount, avgGroupSize, proposalCount, customersCount, deadlineLabel, currentMonthLabel]);

  const startPresenting = async () => {
    setSlideIdx(0);
    setPresenting(true);
    try {
      await presentRef.current?.requestFullscreen?.();
    } catch { /* ignore */ }
  };

  const stopPresenting = () => {
    setPresenting(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    if (!presenting) return;
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(t);
  }, [presenting, slides.length]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!presenting) return;
      if (e.key === 'Escape') stopPresenting();
      if (e.key === 'ArrowRight') setSlideIdx((i) => (i + 1) % slides.length);
      if (e.key === 'ArrowLeft') setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKey);
    };
  }, [presenting, slides.length]);

  const currentSlide = slides[slideIdx];
  const slidePct = currentSlide && currentSlide.target > 0
    ? Math.min(100, Math.round((currentSlide.current / currentSlide.target) * 100))
    : 0;
  const fmt = (n: number, d: number) => d > 0 ? n.toFixed(d) : n.toLocaleString();



  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <PageTitle title="Team Goals" />
          <p className="text-muted-foreground mt-2">
            Targets to hit by {deadlineLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={startPresenting}
            className="rounded-full bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400 text-white hover:opacity-90 border-0 shadow-md"
          >
            ▶ Present
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2">
            <span className="text-lg" aria-hidden>⏳</span>
            <span className="text-sm font-medium text-violet-700">{daysLeft} days left</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GoalCard
          title="Trial Lessons Booked"
          description={`Collective bookings by ${deadlineLabel}`}
          emoji="🗓️"
          current={trialCount}
          target={TRIAL_GOAL}
          loading={loading}
          palette={cardPalettes[0]}
        />
        <GoalCard
          title="Lessons Scheduled"
          description={`Regular lessons scheduled in ${currentMonthLabel}`}
          emoji="🎓"
          current={lessonsCount}
          target={LESSONS_GOAL}
          loading={loading}
          palette={cardPalettes[1]}
        />
        <GoalCard
          title="Avg Students per Group"
          description={`Across ${groupLessonCount.toLocaleString()} group lessons in ${currentMonthLabel}`}
          emoji="👯"
          current={avgGroupSize}
          target={AVG_GROUP_GOAL}
          loading={loading}
          decimals={2}
          remainingLabel={(r) => r > 0 ? `${r.toFixed(2)} to reach target avg` : 'Target avg reached'}
          palette={cardPalettes[2]}
        />
        <GoalCard
          title="Proposals Completed"
          description={`Collective proposals completed by ${deadlineLabel}`}
          emoji="📝"
          current={proposalCount}
          target={PROPOSALS_GOAL}
          loading={loading}
          palette={cardPalettes[3]}
        />
        <Card className={cn(customersPalette.bg, customersPalette.border, 'border')}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Number of Customers</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total active customers by {deadlineLabel}
              </p>
            </div>
            <div className="text-2xl leading-none" aria-hidden>🧑‍🤝‍🧑</div>
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
                      ✅
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingCustomers(false); setCustomersDraft(String(customersCount)); }} disabled={savingCustomers}>
                      ✖️
                    </Button>
                  </div>
                ) : (
                  <div className={cn('text-3xl font-bold', customersPalette.accent)}>
                    {loading ? '—' : customersCount.toLocaleString()}
                    <span className="text-base text-muted-foreground font-medium"> / {CUSTOMERS_GOAL.toLocaleString()}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {loading ? ' ' : `${customersPct}% of goal`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[computeStatus(customersCount, CUSTOMERS_GOAL)])}>
                  {statusLabel[computeStatus(customersCount, CUSTOMERS_GOAL)]}
                </span>
                {isOwner && !editingCustomers && (
                  <Button size="sm" variant="outline" onClick={() => setEditingCustomers(true)}>
                    ✏️
                  </Button>
                )}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', customersPalette.bar)} style={{ width: `${customersPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.max(0, CUSTOMERS_GOAL - customersCount).toLocaleString()} remaining</span>
              {!isOwner && <span className="italic">Owner-only edit</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border border-violet-200 bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🎁</span>
            Team Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            If we hit these goals together, every eligible team member receives:
          </p>
          <ul className="space-y-1.5 pl-1 list-none">
            <li>💰 <span className="font-semibold">CAD $10,000 bonus</span></li>
            <li>🌴 <span className="font-semibold">Every Friday off</span> for a set period</li>
            <li>✈️ An <span className="font-semibold">all-expenses-paid company retreat</span></li>
          </ul>
          <div>
            <p className="font-semibold mb-1">To qualify, you must:</p>
            <ul className="space-y-1.5 pl-1 list-none">
              <li>⏱️ Have been part of the team for at least 3 months</li>
              <li>🌱 Have made a clear contribution to our growth during that time</li>
              <li>🤝 Still be an active, official member of the team when the goals are hit and rewards are paid out</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Let's get it done together. 💪
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
        <span aria-hidden>🎯</span>
        Targets: {TRIAL_GOAL.toLocaleString()} trial bookings · {LESSONS_GOAL.toLocaleString()} lessons scheduled · avg {AVG_GROUP_GOAL} students per group in {currentMonthLabel} · {PROPOSALS_GOAL.toLocaleString()} proposals completed · {CUSTOMERS_GOAL.toLocaleString()} customers
      </div>

      <div
        ref={presentRef}
        className={cn(
          'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-violet-100 to-sky-100 transition-opacity',
          presenting ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {presenting && currentSlide && (
          <>
            <button
              onClick={stopPresenting}
              className="absolute top-6 right-6 text-2xl bg-white/70 rounded-full w-12 h-12 flex items-center justify-center hover:bg-white shadow"
              aria-label="Exit presentation"
            >
              ✖
            </button>
            <div
              key={slideIdx}
              className={cn(
                'w-[80%] max-w-5xl rounded-3xl border-2 p-16 text-center shadow-2xl animate-fade-in',
                currentSlide.palette.bg,
                currentSlide.palette.border
              )}
            >
              <div className="text-[120px] leading-none mb-6">{currentSlide.emoji}</div>
              <h2 className="text-5xl md:text-6xl font-bold mb-4 text-slate-800">{currentSlide.title}</h2>
              <p className="text-xl text-slate-600 mb-10">{currentSlide.sub}</p>
              <div className={cn('text-8xl md:text-9xl font-extrabold mb-2', currentSlide.palette.accent)}>
                {fmt(currentSlide.current, currentSlide.decimals)}
              </div>
              <div className="text-2xl text-slate-500 mb-8">
                of {fmt(currentSlide.target, currentSlide.decimals)} target
              </div>
              <div className="h-4 w-full rounded-full bg-white/70 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', currentSlide.palette.bar)}
                  style={{ width: `${slidePct}%` }}
                />
              </div>
              <div className="mt-3 text-lg font-medium text-slate-600">{slidePct}% of goal</div>
            </div>
            <div className="absolute bottom-8 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  className={cn(
                    'h-2.5 rounded-full transition-all',
                    i === slideIdx ? 'w-8 bg-violet-500' : 'w-2.5 bg-violet-200 hover:bg-violet-300'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="absolute bottom-3 text-xs text-slate-500">
              Auto-advancing every 3s · ← → to navigate · Esc to exit
            </div>
          </>
        )}
      </div>
    </div>
  );

};

export default Goals;
