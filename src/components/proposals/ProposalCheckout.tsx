import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgreementStep from './AgreementStep';
import PaymentCaptureStep from './PaymentCaptureStep';
import { resolveDiscountDeadline } from './discountDeadline';

type Step = 'agreement' | 'payment' | 'done';

interface Props {
  proposal: any;
  initialStep: 'agreement' | 'payment';
  onBackToProposal: () => void;
  onFinished: () => void;
}

const STEPS = [
  { key: 'review', label: 'Review proposal' },
  { key: 'agreement', label: 'Agree terms' },
  { key: 'payment', label: 'Add card' },
];

export default function ProposalCheckout({ proposal, initialStep, onBackToProposal, onFinished }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const deadline = useMemo(() => resolveDiscountDeadline(proposal), [proposal.created_at, proposal.discount_deadline]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [step]);

  const remaining = deadline - now;
  const countdown = (() => {
    if (remaining <= 0) return 'Expired';
    const s = Math.floor(remaining / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const h = Math.floor(s / 3600);
    return h > 0 ? `${h}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s` : `${pad(Math.floor(s / 60))}m ${pad(s % 60)}s`;
  })();

  const times = proposal.lesson_times ?? [];
  const prices = times.map((t: any) => (typeof t.price === 'number' ? t.price : proposal.price_per_lesson));
  const priceLabel = new Set(prices).size > 1 ? 'Priced per lesson' : `£${prices[0] ?? proposal.price_per_lesson} per lesson`;
  const activeIndex = step === 'agreement' ? 1 : step === 'payment' ? 2 : 3;

  return (
    <div className="min-h-screen bg-muted/40 py-6 md:py-10">
      <div className="container max-w-5xl space-y-6">
        <button
          onClick={step === 'agreement' ? onBackToProposal : onBackToProposal}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to proposal
        </button>

        {/* Stepper */}
        <ol className="flex items-center gap-2 md:gap-4">
          {STEPS.map((s, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2 md:gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                    done ? 'border-foreground bg-foreground text-background' : current ? 'border-foreground bg-pastel-mint text-foreground' : 'border-foreground/20 text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`hidden text-sm sm:inline ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-foreground' : 'bg-foreground/15'}`} />}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-start">
          <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {step === 'agreement' && (
              <AgreementStep embedded proposal={proposal} onAgree={() => setStep('payment')} onBack={onBackToProposal} />
            )}
            {step === 'payment' && <PaymentCaptureStep embedded proposal={proposal} onComplete={() => setStep('done')} />}
            {step === 'done' && (
              <div className="space-y-4 rounded-[var(--radius-soft)] bg-background p-8 text-center shadow-[var(--shadow-soft)] md:p-12">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pastel-mint">
                  <CheckCircle2 className="h-7 w-7 text-foreground" />
                </span>
                <h1 className="font-heading text-3xl font-bold text-foreground">You're all set!</h1>
                <p className="text-muted-foreground">
                  Your agreement is signed and your card is saved. We'll be in touch shortly with everything you need for the first lesson.
                </p>
                <Button size="lg" onClick={onFinished} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  View my signed proposal
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="space-y-4 rounded-[var(--radius-soft)] bg-background p-6 shadow-[var(--shadow-soft)] md:sticky md:top-6">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Your programme</p>
            <p className="font-heading text-xl font-bold text-foreground">{proposal.recipient_name}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Lessons per week</dt><dd className="font-semibold">{times.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Price</dt><dd className="font-semibold">{priceLabel}</dd></div>
            </dl>
            {step !== 'done' && (
              <div className="flex items-center gap-3 rounded-[var(--radius-soft)] bg-muted p-4">
                <Clock className="h-5 w-5 shrink-0" />
                <div className="leading-tight">
                  <p className="font-heading text-lg font-bold tabular-nums">{countdown}</p>
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    {remaining <= 0 ? 'Discounted rate expired' : 'Left to claim this rate'}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
