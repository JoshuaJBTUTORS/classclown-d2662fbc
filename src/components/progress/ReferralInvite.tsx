import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useReferral } from '@/hooks/useReferral';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { DoodleSpark, DoodleBook, DoodleStar } from './ProgressDoodles';

const STEPS = [
  { Icon: DoodleSpark, title: 'Share your link', copy: 'Send it to a friend in one tap' },
  { Icon: DoodleBook, title: 'They try a free lesson', copy: 'No cost, no commitment' },
  { Icon: DoodleStar, title: 'You both get £50', copy: 'Once they join us' },
];

/** Refer-a-friend prompt shown at the bottom of the progress page. */
const ReferralInvite: React.FC = () => {
  const navigate = useNavigate();
  const { shareUrl } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Referral link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-pastel-butter p-6 text-pastel-butter-foreground shadow-sm sm:p-8">
      <ScribbleStroke className="pointer-events-none absolute -right-10 -top-8 h-40 w-64 text-pastel-butter-foreground/15" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
            Refer a friend
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Give £50, get £50
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-80">
            Know a family who would love our tutoring? They get £50 off when they join, and you get £50 as a thank you.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/refer')}
              className="h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              Refer a friend
            </Button>
            {shareUrl && (
              <Button
                variant="outline"
                onClick={handleCopy}
                className="h-11 gap-2 rounded-full border-foreground/20 bg-background/70 px-5 text-sm font-medium hover:bg-background"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy my link'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ Icon, title, copy }) => (
            <div
              key={title}
              className="rounded-[1.25rem] border border-foreground/10 bg-background/80 p-4 text-foreground"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-heading text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReferralInvite;
