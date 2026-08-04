import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Link2, PoundSterling } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import ShareLinkCard from '@/components/referral/ShareLinkCard';
import ReferralForm from '@/components/referral/ReferralForm';
import ReferralList from '@/components/referral/ReferralList';
import GiftIllustration from '@/components/referral/GiftIllustration';

const STEPS = [
  { icon: Link2, title: 'Share your link', copy: 'Send your personal link to a friend' },
  { icon: Gift, title: 'They try a free lesson', copy: 'No cost, no commitment' },
  { icon: PoundSterling, title: 'You both get £50', copy: 'Once they join us' },
];

const ReferFriend: React.FC = () => {
  const navigate = useNavigate();
  const { shareUrl, referrals, isLoading, submitReferral } = useReferral();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to my lessons
        </Button>

        <section className="grid items-center gap-8 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div>
            <span className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-background/70 py-1.5 pl-1.5 pr-4 text-xs font-extrabold uppercase tracking-widest text-primary">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10">
                <Gift className="h-4 w-4" />
              </span>
              Refer a friend
            </span>

            <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-tighter">
              Give £50, <span className="text-primary">get £50</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Know a family who would love our tutoring? Your friend gets £50 off when they join, and you get £50 as a
              thank you.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <GiftIllustration className="min-h-[280px]" />
        </section>

        <ShareLinkCard shareUrl={shareUrl} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ReferralForm onSubmit={submitReferral} />
          <ReferralList referrals={referrals} />
        </div>
      </div>
    </div>
  );
};

export default ReferFriend;
