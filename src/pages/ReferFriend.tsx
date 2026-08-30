import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/contexts/AuthContext';
import ShareLinkCard from '@/components/referral/ShareLinkCard';
import ReferralForm from '@/components/referral/ReferralForm';
import ReferralList from '@/components/referral/ReferralList';
import GiftIllustration from '@/components/referral/GiftIllustration';
import GetLinkCard from '@/components/referral/GetLinkCard';
import { DoodleChat, DoodleCoin, DoodleSend, DoodleSpark } from '@/components/progress/ProgressDoodles';

const STEPS = [
  { icon: DoodleChat, title: 'Share your link', copy: 'Send your personal link to a friend' },
  { icon: DoodleSpark, title: 'They try a free lesson', copy: 'No cost, no commitment' },
  { icon: DoodleCoin, title: 'You both get £50', copy: 'Once they join us' },
];

const pillBase =
  'inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const chipBase = cn(
  pillBase,
  'pl-2 pr-4 gap-2.5 bg-transparent text-foreground border border-foreground hover:-translate-y-0.5 hover:bg-foreground/5',
);
const chipIcon =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground';

const ReferFriend: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    shareUrl,
    referrals,
    isLoading,
    submitReferral,
    submitPublicReferral,
    guestLink,
    requestPublicLink,
  } = useReferral();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {user ? (
          <button type="button" onClick={() => navigate('/calendar')} className={chipBase}>
            <span className={chipIcon}>
              <ArrowLeft className="h-4 w-4" />
            </span>
            Back to my lessons
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/auth')} className={chipBase}>
            <span className={chipIcon}>
              <ArrowLeft className="h-4 w-4" />
            </span>
            Log in to my account
          </button>
        )}

        <section className="grid items-center gap-8 rounded-3xl border border-foreground/10 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-foreground bg-transparent py-1.5 pl-1.5 pr-4 text-xs font-extrabold uppercase tracking-widest text-foreground">
              <span className={chipIcon} aria-hidden="true">
                <DoodleCoin className="h-4 w-4" />
              </span>
              Refer a friend
            </span>

            <h1 className="mt-6 font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-tighter">
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
                  className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-4"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-foreground/70 text-foreground"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold leading-tight">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <GiftIllustration className="min-h-[280px]" />
        </section>

        {user ? (
          <>
            <ShareLinkCard shareUrl={shareUrl} isLoading={isLoading} />

            <div className="grid gap-6 lg:grid-cols-2">
              <ReferralForm onSubmit={submitReferral} />
              <ReferralList referrals={referrals} />
            </div>
          </>
        ) : (
          <>
            {guestLink ? (
              <ShareLinkCard shareUrl={guestLink.shareUrl} />
            ) : (
              <GetLinkCard onSubmit={requestPublicLink} />
            )}

            <div className="mx-auto w-full max-w-2xl">
              <ReferralForm
                mode="public"
                onSubmit={submitPublicReferral}
                initialReferrer={guestLink ? { name: guestLink.name, email: guestLink.email } : undefined}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReferFriend;
