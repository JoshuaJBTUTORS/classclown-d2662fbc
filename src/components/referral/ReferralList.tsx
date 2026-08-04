import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Referral } from '@/hooks/useReferral';

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  trial_booked: 'Trial booked',
  joined: 'Joined',
  reward_paid: 'Reward paid',
};

const statusVariant = (status: string): 'secondary' | 'default' | 'outline' =>
  status === 'reward_paid' || status === 'joined' ? 'default' : status === 'trial_booked' ? 'secondary' : 'outline';

interface ReferralListProps {
  referrals: Referral[];
}

export const ReferralList: React.FC<ReferralListProps> = ({ referrals }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Your referrals</CardTitle>
    </CardHeader>
    <CardContent>
      {referrals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No referrals yet. Share your link or send us a friend's details to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {referrals.map((referral) => (
            <li key={referral.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{referral.friend_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {referral.friend_email || referral.friend_phone || 'Booked via your link'}
                  {' · '}
                  {format(new Date(referral.created_at), 'd MMM yyyy')}
                </p>
              </div>
              <Badge variant={statusVariant(referral.status)} className="shrink-0">
                {STATUS_LABELS[referral.status] || referral.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default ReferralList;
