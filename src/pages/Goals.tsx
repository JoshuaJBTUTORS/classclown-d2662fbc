import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Target, Calendar as CalendarIcon, GraduationCap } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { getAdminDashboardData, AdminDashboardData } from '@/services/adminDashboardService';
import { cn } from '@/lib/utils';

const LESSONS_GOAL = 2000;
const TRIAL_GOAL = 1500;

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

function computeStatus(current: number, target: number, selectedMonth: Date): Status {
  if (current >= target) return 'achieved';
  const now = new Date();
  const isCurrent =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();
  const isFuture =
    selectedMonth.getFullYear() > now.getFullYear() ||
    (selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() > now.getMonth());
  if (isFuture) return 'on-track';
  if (!isCurrent) return 'not-achieved';
  const totalDays = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const expected = target * (now.getDate() / totalDays);
  return current < 0.9 * expected ? 'behind' : 'on-track';
}

interface GoalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  selectedMonth: Date;
}

const GoalCard: React.FC<GoalCardProps> = ({ title, description, icon, current, target, selectedMonth }) => {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, target - current);
  const status = computeStatus(current, target, selectedMonth);

  const now = new Date();
  const isCurrent =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();
  const totalDays = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const daysLeft = isCurrent ? Math.max(0, totalDays - now.getDate()) : 0;

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
              {current.toLocaleString()}
              <span className="text-base text-muted-foreground font-medium"> / {target.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{pct}% of goal</div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', statusClass[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <Progress value={pct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining.toLocaleString()} remaining</span>
          {isCurrent && <span>{daysLeft} day{daysLeft === 1 ? '' : 's'} left in month</span>}
        </div>
      </CardContent>
    </Card>
  );
};

const Goals: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboardData({
      year: selectedMonth.getFullYear(),
      month: selectedMonth.getMonth(),
    })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => console.error('Failed to load goals data', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedMonth]);

  const label = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();

  const goPrev = () =>
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const goNext = () => {
    if (isCurrentMonth) return;
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Team Goals" />
          <p className="text-muted-foreground mt-2">Progress against monthly targets for {label}</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[130px] text-center">{label}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalCard
          title="Lessons Scheduled"
          description="Regular lessons scheduled this month"
          icon={<GraduationCap className="h-5 w-5" />}
          current={loading ? 0 : (data?.regularLessonsCount ?? 0)}
          target={LESSONS_GOAL}
          selectedMonth={selectedMonth}
        />
        <GoalCard
          title="Trial Lessons Booked"
          description="New trial bookings this month"
          icon={<CalendarIcon className="h-5 w-5" />}
          current={loading ? 0 : (data?.trialLessonsBooked ?? 0)}
          target={TRIAL_GOAL}
          selectedMonth={selectedMonth}
        />
      </div>

      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
        <Target className="h-3.5 w-3.5" />
        Targets: {LESSONS_GOAL.toLocaleString()} lessons scheduled · {TRIAL_GOAL.toLocaleString()} trial bookings
      </div>
    </div>
  );
};

export default Goals;
