import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Sparkles, CalendarOff, FileSignature, RefreshCw, ArrowRight, UserX, BookOpen, Hourglass } from 'lucide-react';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import { useAuth } from '@/contexts/AuthContext';
import { getSnapshotConfig, type SnapshotTileKey, type SnapshotGoalKey } from '@/lib/agentCleoRoleConfig';
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
    className="text-left p-4 rounded-3xl border border-black/70 bg-transparent hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/50 dark:hover:bg-white/5 transition-all duration-200"
  >
    <div className="flex items-center gap-2.5 mb-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/60 text-black dark:border-white/50 dark:text-white">
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b76] dark:text-[#8e8ea0]">
        {label}
      </span>
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
  const { profile } = useAuth();
  const config = getSnapshotConfig(profile?.job_title);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const tiles: Record<SnapshotTileKey, React.ReactNode> = {
    sessions: (
      <Tile
        key="sessions"
        icon={<CalendarDays className="w-3.5 h-3.5" />}
        label="Sessions today"
        value={data.sessionsToday}
        sub={`${fmt(data.sessionsDone)} done · ${fmt(data.sessionsUpcoming)} to come`}
        loading={loading}
        onClick={() => navigate('/calendar')}
      />
    ),
    trials: (
      <Tile
        key="trials"
        icon={<Sparkles className="w-3.5 h-3.5" />}
        label="Trials today"
        value={data.trialsToday}
        sub="Trial lessons booked for today"
        loading={loading}
        onClick={() => navigate('/trial-bookings')}
      />
    ),
    timeOff: (
      <Tile
        key="timeOff"
        icon={<CalendarOff className="w-3.5 h-3.5" />}
        label="Time off"
        value={data.pendingTimeOff}
        sub="Requests awaiting approval"
        loading={loading}
        onClick={() => navigate('/time-off-requests')}
      />
    ),
    proposalsSigned: (
      <Tile
        key="proposalsSigned"
        icon={<FileSignature className="w-3.5 h-3.5" />}
        label="Proposals signed"
        value={data.proposalsThisWeek}
        sub={`This week · ${fmt(data.proposalsToday)} today`}
        loading={loading}
        onClick={() => navigate('/admin/proposals/signed')}
      />
    ),
    proposalsAwaiting: (
      <Tile
        key="proposalsAwaiting"
        icon={<Hourglass className="w-3.5 h-3.5" />}
        label="Awaiting signature"
        value={data.proposalsAwaiting}
        sub="Proposals sent, not yet signed"
        loading={loading}
        onClick={() => navigate('/admin/proposals')}
      />
    ),
    missed: (
      <Tile
        key="missed"
        icon={<UserX className="w-3.5 h-3.5" />}
        label="Missed lessons"
        value={data.missedThisWeek}
        sub="Student absences this week"
        loading={loading}
        onClick={() => navigate('/lessonsummaries')}
      />
    ),
    homework: (
      <Tile
        key="homework"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        label="Homework"
        value={data.homeworkSubmittedThisWeek}
        sub={`Submitted this week · ${fmt(data.homeworkSetThisWeek)} set`}
        loading={loading}
        onClick={() => navigate('/homework')}
      />
    ),
  };

  const goals: Record<SnapshotGoalKey, React.ReactNode> = {
    trials: <GoalRow key="trials" label="Trials booked" current={data.goalTrials} target={TRIAL_GOAL} loading={loading} />,
    lessons: <GoalRow key="lessons" label="Lessons this month" current={data.goalLessons} target={LESSONS_GOAL} loading={loading} />,
    proposals: <GoalRow key="proposals" label="Proposals completed" current={data.goalProposals} target={PROPOSALS_GOAL} loading={loading} />,
    customers: <GoalRow key="customers" label="Customers" current={data.goalCustomers} target={CUSTOMERS_GOAL} loading={loading} />,
  };

  return (
    <div className="w-full max-w-2xl mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b76] dark:text-[#8e8ea0]">Today · {today}</span>
        <button
          onClick={refresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/60 text-black hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/50 dark:text-white dark:hover:bg-white/5 transition-all duration-200"
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

      <div className="mt-3 p-4 rounded-3xl border border-black/70 bg-transparent dark:border-white/50">
        <button
          onClick={() => navigate('/goals')}
          className="inline-flex items-center gap-2 rounded-full border border-black/60 pl-2 pr-4 h-9 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b76] hover:-translate-y-0.5 hover:bg-black/5 hover:text-black dark:border-white/50 dark:text-[#8e8ea0] dark:hover:bg-white/5 dark:hover:text-white transition-all duration-200 mb-4"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/60 dark:border-white/50">
            <ArrowRight className="w-3 h-3" />
          </span>
          Team goals
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
