import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Referral } from '@/hooks/useReferral';

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  trial_booked: 'Trial booked',
  joined: 'Joined',
  reward_paid: 'Reward paid',
};

const statusChip = (status: string): string =>
  status === 'reward_paid' || status === 'joined'
    ? 'border-foreground/15 bg-pastel-mint text-pastel-mint-foreground'
    : status === 'trial_booked'
      ? 'border-foreground/15 bg-pastel-butter text-pastel-butter-foreground'
      : 'border-foreground/15 bg-background text-muted-foreground';

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

interface ReferralListProps {
  referrals: Referral[];
}

export const ReferralList: React.FC<ReferralListProps> = ({ referrals }) => (
  <section className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
    <h2 className="font-heading text-xl font-bold tracking-tight">Your referrals</h2>
    <div className="mt-4">
      {referrals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No referrals yet. Share your link or send us a friend's details to get started.
        </p>
      ) : (
        <ul className="divide-y divide-foreground/10">
          {referrals.map((referral) => (
            <li key={referral.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-foreground/15 bg-pastel-lilac/60 font-heading text-xs font-bold text-foreground"
                  aria-hidden="true"
                >
                  {initials(referral.friend_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{referral.friend_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {referral.friend_email || referral.friend_phone || 'Booked via your link'}
                    {' · '}
                    {format(new Date(referral.created_at), 'd MMM yyyy')}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold',
                  statusChip(referral.status),
                )}
              >
                {STATUS_LABELS[referral.status] || referral.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

export default ReferralList;
