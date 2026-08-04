import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Gift, Users, PoundSterling } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import ShareLinkCard from '@/components/referral/ShareLinkCard';
import ReferralForm from '@/components/referral/ReferralForm';
import ReferralList from '@/components/referral/ReferralList';

const ReferFriend: React.FC = () => {
  const navigate = useNavigate();
  const { shareUrl, referrals, isLoading, submitReferral } = useReferral();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to my lessons
      </Button>

      <section className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Give £50, get £50</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Know a family who would love our tutoring? Your friend gets £50 off when they join, and you get £50 as a thank you.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Share your link</p>
              <p className="text-xs text-muted-foreground">Or send us their details</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <Gift className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">They try a free lesson</p>
              <p className="text-xs text-muted-foreground">No cost, no commitment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <PoundSterling className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">You both get £50</p>
              <p className="text-xs text-muted-foreground">Once they join us</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <ShareLinkCard shareUrl={shareUrl} isLoading={isLoading} />
      <ReferralForm onSubmit={submitReferral} />
      <ReferralList referrals={referrals} />
    </div>
  );
};

export default ReferFriend;
