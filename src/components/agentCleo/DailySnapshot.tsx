import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Sparkles, CalendarOff, FileSignature, RefreshCw, ArrowRight } from 'lucide-react';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import {
  CUSTOMERS_GOAL,
  LESSONS_GOAL,
  PROPOSALS_GOAL,
  TRIAL_GOAL,
  computeStatus,
  goalStatusLabel,
  type GoalStatus,
} from '@/lib/goals';
import { cn } from '@/lib/utils';

const statusClass: Record<GoalStatus, string> = {
  'achieved': 'text-violet-700 border-violet-400/40 bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/30',
  'on-track': 'text-sky-700 border-sky-400/40 bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/30',
  'behind': 'text-amber-700 border-amber-400/40 bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30',
  'not-achieved': 'text-rose-700 border-rose-400/40 bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/30',
};

const barClass: Record<GoalStatus, string> = {
  'achieved': 'bg-violet-500 dark:bg-violet-400',
  'on-track': 'bg-sky-500 dark:bg-sky-400',
  'behind': 'bg-amber-500 dark:bg-amber-400',
  'not-achieved': 'bg-rose-500 dark:bg-rose-400',
};

const fmt = (n: number | null) => (n === null || n === undefined ? '—' : n.toLocaleString());

interface TileProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  sub: string;
  loading: boolean;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = ({ icon, label, value, sub, loading, onClick }) => (
  <button
    onClick={onClick}
    className="text-left p-4 rounded-2xl border border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5 transition-colors"
  >
    <div className="flex items-center gap-2 text-[#6b6b76] dark:text-[#8e8ea0] text-xs mb-2">
      {icon}
      <span>{label}</span>
    </div>
    {loading ? (
      <div className="h-8 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
    ) : (
      <div className="text-3xl font-semibold leading-none">{fmt(value)}</div>
    )}
    <div className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mt-2">{loading ? ' ' : sub}</div>
  </button>
);

interface GoalRowProps {
  label: string;
  current: number | null;
  target: number;
  loading: boolean;
}

const GoalRow: React.FC<GoalRowProps> = ({ label, current, target, loading }) => {
  const value = current ?? 0;
  const status = computeStatus(value, target);
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] truncate">{label}</span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border shrink-0', statusClass[status])}>
          {goalStatusLabel[status]}
        </span>
      </div>
      <div className="text-sm font-medium mb-1.5">
        {loading ? '—' : fmt(current)}
        <span className="text-[#6b6b76] dark:text-[#8e8ea0] font-normal"> / {target.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barClass[status])} style={{ width: `${loading ? 0 : pct}%` }} />
      </div>
    </div>
  );
};

const DailySnapshot: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, refresh } = useDailySnapshot();

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="w-full max-w-2xl mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-[#6b6b76] dark:text-[#8e8ea0]">Today · {today}</span>
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#6b6b76] dark:text-[#8e8ea0] transition-colors"
          aria-label="Refresh snapshot"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          label="Sessions today"
          value={data.sessionsToday}
          sub={`${fmt(data.sessionsDone)} done · ${fmt(data.sessionsUpcoming)} to come`}
          loading={loading}
          onClick={() => navigate('/calendar')}
        />
        <Tile
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Trials today"
          value={data.trialsToday}
          sub="Trial lessons booked for today"
          loading={loading}
          onClick={() => navigate('/trial-bookings')}
        />
        <Tile
          icon={<CalendarOff className="w-3.5 h-3.5" />}
          label="Time off"
          value={data.pendingTimeOff}
          sub="Requests awaiting approval"
          loading={loading}
          onClick={() => navigate('/time-off-requests')}
        />
        <Tile
          icon={<FileSignature className="w-3.5 h-3.5" />}
          label="Proposals signed"
          value={data.proposalsThisWeek}
          sub={`This week · ${fmt(data.proposalsToday)} today`}
          loading={loading}
          onClick={() => navigate('/admin/proposals/signed')}
        />
      </div>

      <div className="mt-3 p-4 rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-transparent">
        <button
          onClick={() => navigate('/goals')}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#6b6b76] dark:text-[#8e8ea0] hover:text-black dark:hover:text-white transition-colors mb-4"
        >
          Team goals <ArrowRight className="w-3 h-3" />
        </button>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GoalRow label="Trials booked" current={data.goalTrials} target={TRIAL_GOAL} loading={loading} />
          <GoalRow label="Lessons this month" current={data.goalLessons} target={LESSONS_GOAL} loading={loading} />
          <GoalRow label="Proposals completed" current={data.goalProposals} target={PROPOSALS_GOAL} loading={loading} />
          <GoalRow label="Customers" current={data.goalCustomers} target={CUSTOMERS_GOAL} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DailySnapshot;
