import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Mail, Phone, Printer, PlayCircle, Clock, Menu, ChevronDown } from 'lucide-react';
import jbLogo from '@/assets/jb-tutors-logo.png';
import { resolveDiscountDeadline } from './discountDeadline';

const INTRO_VIDEO_URL = 'https://share.descript.com/embed/GAcvB7aW73w';
const CONTACT_EMAIL = 'enquiries@classbeyondacademy.io';
const CONTACT_PHONE = '01438 582848';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'The Plan' },
  { id: 'included', label: "What's Included" },
  { id: 'results', label: 'Results' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'terms', label: 'Terms' },
];

const FAQS = [
  { q: 'How are tutors matched to my child?', a: 'We match based on subject, exam board, target level, and personality fit. If the pairing does not feel right after the first lesson, we rematch at no cost.' },
  { q: 'What happens if we need to cancel a lesson?', a: 'Cancel or reschedule with at least 24 hours notice at no charge. Cancellations inside 24 hours are charged at the full lesson rate.' },
  { q: 'Are lessons recorded?', a: 'Yes. Every lesson is recorded and available in your parent dashboard for revision, so your child can revisit anything they missed.' },
  { q: 'How is progress tracked?', a: 'You get a parent dashboard with lesson notes, homework completion, and half-termly written assessments with tutor feedback.' },
  { q: 'What if we want to change subjects or add a session?', a: 'Just reply to any email or call us on 01438 582848. Changes take effect from the following week.' },
];

interface Proposal {
  id: string;
  recipient_name: string;
  lesson_type: string;
  subject: string;
  price_per_lesson: number;
  payment_cycle: string;
  contract_term?: 'month_to_month' | '3_months' | '12_months' | '24_months' | null;
  programme_start_date?: string | null;
  lesson_times: Array<{ day: string; time: string; duration: number; subject?: string; price?: number }>;
  status: string;
  created_at: string;
  discount_deadline?: string | null;
  
  agreed_at?: string | null;
}

interface Props {
  proposal: Proposal;
  onConfirm: () => void;
  onProposalUpdate: (p: Proposal) => void;
  signed?: boolean;
  signedAt?: string | null;
  onContinuePayment?: () => void;
  showPaymentBanner?: boolean;
}

export default function ProposalLayout({ proposal, onConfirm, onProposalUpdate, signed = false, signedAt = null, onContinuePayment, showPaymentBanner = false }: Props) {

  const [active, setActive] = useState('overview');
  

  // Discount countdown: explicit deadline if set, otherwise 24h from creation
  const deadline = useMemo(() => resolveDiscountDeadline(proposal), [proposal.created_at, proposal.discount_deadline]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = deadline - now;
  const countdownLabel = (() => {
    if (remainingMs <= 0) return 'Expired';
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${pad(m)}m ${pad(s)}s`;
  })();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const totalMinutesPerWeek = proposal.lesson_times.reduce((sum, t) => sum + (t.duration || 0), 0);
  const uniqueSubjects = Array.from(new Set(proposal.lesson_times.map((t) => t.subject || proposal.subject)));
  const rowPrice = (t: { price?: number }) =>
    typeof t.price === 'number' ? t.price : proposal.price_per_lesson;
  
  const hasMixedPricing = new Set(proposal.lesson_times.map(rowPrice)).size > 1;

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortRef = `CB-${proposal.id.slice(0, 8).toUpperCase()}`;
  const programmeStartStr = proposal.programme_start_date
    ? new Date(`${proposal.programme_start_date}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const termLabel =
    proposal.contract_term === '24_months'
      ? '24 months'
      : proposal.contract_term === '12_months'
      ? '12 months'
      : proposal.contract_term === 'month_to_month'
      ? '1 month'
      : '3 months';
  const signedDateStr = signedAt
    ? new Date(signedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;


  return (
    <div className="min-h-screen bg-background proposal-doc">
      {/* Print + signed watermark styles */}
      <style>{`
        .proposal-doc .signed-watermark { position: fixed; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .proposal-doc .signed-watermark span { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 20vw; letter-spacing: 0.05em; color: hsl(var(--primary) / 0.06); transform: rotate(-24deg); user-select: none; white-space: nowrap; }
        @media print {
          .proposal-doc .no-print { display: none !important; }
          .proposal-doc .signed-watermark span { color: rgba(0,0,0,0.12) !important; }
        }
      `}</style>

      {signed && (
        <div className="signed-watermark" aria-hidden>
          <span>SIGNED</span>
        </div>
      )}

      {/* Top action bar */}
      <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <span className="font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">Class<span className="text-primary">Beyond</span></span>
          </div>


          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="mr-2 h-4 w-4" /> Contact us
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> {signed ? 'Download / Print' : 'Print'}
            </Button>
            {signed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                <Check className="h-3.5 w-3.5" />
                Signed{signedDateStr ? ` · ${signedDateStr}` : ''}
              </span>
            ) : (
              <Button size="sm" onClick={onConfirm}>
                Confirm & get started
              </Button>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            {signed ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-600/10 px-2 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
                <Check className="h-3 w-3" /> Signed
              </span>
            ) : (
              <Button size="sm" onClick={onConfirm} className="h-8 px-3 text-xs">
                Confirm
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={`mailto:${CONTACT_EMAIL}`}>
                    <Mail className="mr-2 h-4 w-4" /> Contact us
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call {CONTACT_PHONE}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> {signed ? 'Download / Print' : 'Print'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {showPaymentBanner && onContinuePayment && (
          <div className="border-t border-border/60 bg-primary/5">
            <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 px-6 py-3 sm:flex-row sm:items-center">
              <p className="text-sm">
                <span className="font-semibold text-primary">Next step:</span> complete your payment setup to activate lessons.
              </p>
              <Button size="sm" onClick={onContinuePayment}>Complete payment setup</Button>
            </div>
          </div>
        )}
      </header>


      <div className="mx-auto flex max-w-[1400px] gap-12 px-4 py-8 md:px-6 md:py-10">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Proposal</p>
              <p className="mt-1 font-heading text-lg font-semibold text-foreground">{proposal.recipient_name}</p>
              <p className="text-xs text-muted-foreground">Ref {shortRef}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${
                    active === s.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-24">
          {/* Mobile section jump dropdown */}
          <div className="lg:hidden -mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="truncate">
                    <span className="text-muted-foreground">Jump to: </span>
                    <span className="font-medium">{SECTIONS.find((s) => s.id === active)?.label ?? 'Section'}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm">
                {SECTIONS.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={active === s.id ? 'bg-primary/10 text-primary font-medium' : ''}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Overview */}
          <section id="overview" className="space-y-10 scroll-mt-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Class Beyond Proposal
              </p>
              <h1 className="mt-3 font-heading text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                A tailored plan for
                <br />
                <span className="text-primary">{proposal.recipient_name}</span>
              </h1>
              {!signed && (
                <div
                  className={`mt-6 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 md:gap-3 md:px-6 md:py-4 ${
                    remainingMs <= 0
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-primary/30 bg-primary/5 text-primary'
                  }`}
                  title="Time remaining to confirm this proposal"
                >
                  <Clock className="h-6 w-6 md:h-8 md:w-8" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-heading text-2xl font-bold tabular-nums md:text-4xl">{countdownLabel}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80 md:text-xs">
                      {remainingMs <= 0
                        ? 'Discounted rate expired'
                        : 'Left to claim this discounted rate'}
                    </span>

                  </div>
                </div>
              )}

              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                {(() => {
                  switch (proposal.lesson_type) {
                    case 'Group Session':
                    case 'group':
                      return "A focused small-group tuition programme aligned to your child's exam board and pace, delivered by subject specialists we've hand-picked.";
                    case 'Large Group Session':
                      return "A structured large-group tuition programme aligned to your child's exam board and pace, delivered in a classroom-style setting by subject specialists we've hand-picked.";
                    case 'Mixed':
                      return "A blended tuition programme combining focused 1-to-1 sessions with collaborative group learning, aligned to your child's exam board and pace, delivered by subject specialists we've hand-picked.";
                    default:
                      return "A dedicated 1-to-1 tuition programme designed around your child's goals, exam board and pace, delivered by subject specialists we've hand-picked.";
                  }
                })()}
              </p>
            </div>

            {/* Prepared by */}
            <div className={`relative grid gap-6 rounded-2xl border p-6 md:grid-cols-[auto_1fr_auto] md:items-center ${signed ? 'border-green-600/40 bg-green-600/5' : 'border-border bg-card'}`}>
              {signed && (
                <div className="absolute -top-3 right-4 inline-flex items-center gap-1.5 rounded-full border border-green-600/40 bg-background px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                  <Check className="h-3 w-3" /> Signed
                </div>
              )}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-semibold text-primary">
                CB
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Prepared by</p>
                <p className="font-heading text-lg font-semibold">Class Beyond Admissions Team</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-1.5 hover:text-primary">
                    <Mail className="h-3.5 w-3.5" /> {CONTACT_EMAIL}
                  </a>
                  <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-primary">
                    <Phone className="h-3.5 w-3.5" /> {CONTACT_PHONE}
                  </a>
                </div>
                {signed && signedDateStr && (
                  <p className="pt-2 text-sm font-medium text-green-700 dark:text-green-400">
                    Agreement accepted by {proposal.recipient_name} on {signedDateStr}.
                  </p>
                )}
              </div>
              <div className="text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="mt-1 font-medium">{dateStr}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Ref {shortRef}</p>
              </div>
            </div>


            {/* Programme start date & term */}
            <div className="grid gap-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:grid-cols-2 md:p-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Programme start date</p>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {programmeStartStr ?? 'To be confirmed'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Your programme will begin on this date, and lessons scheduled from this date will form part of your
                  programme unless an alternative start date has been agreed by Class Beyond Academy in writing
                  beforehand.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Programme term</p>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {termLabel}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This agreement is for a minimum term of {termLabel}, beginning on the programme start date stated
                  above.
                </p>
              </div>
            </div>

            {/* Video */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <PlayCircle className="h-6 w-6" />
                <p className="text-lg md:text-xl font-semibold uppercase tracking-widest">A message from our CEO</p>
              </div>
              <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                <iframe
                  src={INTRO_VIDEO_URL}
                  title="Class Beyond intro"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Key stats */}
            <div className="grid gap-6 border-y border-border py-8 md:grid-cols-3">
              <Stat label="Lessons per week" value={String(proposal.lesson_times.length)} />
              <Stat label="Minutes per week" value={String(totalMinutesPerWeek)} />
              <Stat label={uniqueSubjects.length === 1 ? 'Subject' : 'Subjects'} value={String(uniqueSubjects.length)} sub={uniqueSubjects.join(', ')} />
            </div>
          </section>

          {/* The Plan */}
          <Section id="plan" eyebrow="The Plan" title="Your weekly schedule">
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* Mobile: stacked cards */}
              <div className="md:hidden">
                {proposal.lesson_times.map((t, i) => (
                  <div key={i} className={`px-4 py-4 ${i > 0 ? 'border-t border-border' : ''}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-foreground">{t.day}</span>
                      <span className="font-semibold text-foreground">£{rowPrice(t)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.time} · {t.duration} min
                    </p>
                    <p className="mt-1 text-sm text-foreground">{t.subject || proposal.subject}</p>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Day</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                    <th className="px-5 py-3 font-semibold">Duration</th>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.lesson_times.map((t, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-5 py-4 font-medium">{t.day}</td>
                      <td className="px-5 py-4">{t.time}</td>
                      <td className="px-5 py-4 text-muted-foreground">{t.duration} min</td>
                      <td className="px-5 py-4">{t.subject || proposal.subject}</td>
                      <td className="px-5 py-4 text-right font-semibold">£{rowPrice(t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>


            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Lesson type: <span className="font-medium text-foreground">{proposal.lesson_type}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Lesson times may occasionally be adjusted by mutual agreement or where operationally necessary.
            </p>
          </Section>

          {/* Included */}
          <Section id="included" eyebrow="What's Included" title="Everything you get, every week">
            <ul className="grid gap-4 md:grid-cols-2">
              {[
                'Lesson recordings available for revision',
                'Unlimited access to our learning hub e-learning courses',
                'Parent dashboard with progress updates and six-week check-ins',
                'Half-termly assessments with written tutor feedback',
                'Homework after each session, marked to track progress',
                'Direct line to our admissions team for anything you need',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Results */}
          <Section id="results" eyebrow="Results" title="Our track record speaks for itself">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { n: '92%', l: 'A*/A rate at GCSE' },
                { n: '95%', l: '11+ pass rate' },
                { n: '98%', l: 'Parent satisfaction' },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-border bg-card p-8">
                  <p className="font-heading text-5xl font-bold text-primary">{s.n}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Pricing */}
          <Section id="pricing" eyebrow="Pricing" title="Simple, transparent pricing">
            <div className="rounded-2xl border border-border bg-card p-8">
              {hasMixedPricing ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold text-foreground">Priced per lesson</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-5xl font-bold text-foreground">£{rowPrice(proposal.lesson_times[0] ?? {})}</span>
                  <span className="text-muted-foreground">per lesson</span>
                </div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {hasMixedPricing
                  ? 'Each session is priced individually (see the weekly schedule above).'
                  : `Each session is charged at £${rowPrice(proposal.lesson_times[0] ?? {})}.`}{' '}
                Billed <span className="font-medium text-foreground">every 4 weeks in advance</span>. No sign-up fee.
              </p>



              {/* Contract term */}
              {(() => {
                const term = proposal.contract_term || 'month_to_month';
                const label =
                  term === '24_months'
                    ? '24 Months'
                    : term === '12_months'
                      ? '12 Months'
                      : term === '3_months'
                        ? '3 Months'
                        : 'Month to Month';
                return (
                  <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Contract term</p>
                        <p className="mt-1 font-heading text-2xl font-bold text-foreground">{label}</p>
                      </div>
                      <span className="rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-semibold text-primary">
                        Auto-renews
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>During the term, the number of sessions cannot be reduced and the plan cannot be downgraded.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>You can increase sessions or upgrade at any time.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>At the end of the term the contract auto-renews. To cancel or downgrade, let us know at least <strong className="text-foreground">30 days before</strong> the term end date.</span>
                      </li>
                    </ul>
                  </div>
                );
              })()}

            </div>

          </Section>

          {/* FAQs */}
          <Section id="faqs" eyebrow="FAQs" title="Common questions">
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`f-${i}`} className="border-border px-5 last:border-0">
                  <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>

          {/* Terms */}
          <Section id="terms" eyebrow="Terms" title="The fine print">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Safeguarding.</strong> All tutors are enhanced DBS checked and complete
                annual safeguarding training. Every session is recorded and stored securely for review.
              </p>
              <p>
                <strong className="text-foreground">Cancellations & term.</strong> Reschedule or cancel individual lessons with 24 hours notice at no cost. Your contract term is{' '}
                <strong className="text-foreground">
                  {proposal.contract_term === '24_months' ? '24 months' : proposal.contract_term === '12_months' ? '12 months' : proposal.contract_term === '3_months' ? '3 months' : 'month to month'}
                </strong>{' '}
                and auto-renews at the end. During the term you cannot reduce the number of sessions or downgrade — upgrades are always welcome. To cancel or downgrade at renewal, give us at least 30 days' written notice before the term end date.
              </p>
              <p>
                <strong className="text-foreground">Teacher allocation.</strong> Class Beyond Academy assigns teachers based on
                subject expertise, availability and student needs. We aim to provide consistency of teaching wherever
                possible; however, the programme is provided by Class Beyond Academy and does not guarantee lessons with
                any particular individual teacher. Where a teacher is unavailable due to illness, absence or other
                circumstances, Class Beyond Academy may provide another suitable teacher or reschedule the lesson.
              </p>
              <p>
                <strong className="text-foreground">Payment.</strong> No payment is required before the programme begins. Your
                first payment will be collected following your child's first scheduled lesson. The programme itself
                nevertheless begins on the programme start date shown above.
              </p>
              <p>
                <strong className="text-foreground">Missed lessons / no-shows.</strong> A scheduled lesson that the student does
                not attend will still count as a delivered programme session unless it has been cancelled or rearranged
                in accordance with our cancellation policy. We require at least 24 hours' notice to cancel or rearrange a
                lesson. Lessons missed with less than 24 hours' notice may be charged and may not be rescheduled.
              </p>
              <p>
                <strong className="text-foreground">Class Beyond Academy cancellations.</strong> If Class Beyond Academy is
                unable to provide a scheduled lesson and cannot provide a suitable alternative teacher, the lesson will be
                rearranged and will not be treated as a student absence.
              </p>
              <p>
                <strong className="text-foreground">Substitute teachers.</strong> On occasion, another member of our teaching
                team may deliver a lesson due to teacher illness, annual leave, scheduling requirements or other
                unforeseen circumstances. The use of a substitute teacher does not constitute cancellation of the
                programme.
              </p>
              <p>
                <strong className="text-foreground">Changing your start date.</strong> Requests to delay or change the programme
                start date must be agreed with Class Beyond Academy in writing before the scheduled start date. A
                requested change is not confirmed until acknowledged by us in writing.
              </p>
              <p>
                <strong className="text-foreground">Parent / guardian responsibility.</strong> Parents/guardians are responsible
                for ensuring that the student is available and able to access lessons at the scheduled time.
              </p>
              <p>
                <strong className="text-foreground">Data.</strong> We hold pupil and parent data in line with UK GDPR and only
                share it with the tutor assigned to your child. Full policy on request.
              </p>
            </div>

            {signed ? (
              <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border-2 border-green-600/40 bg-green-600/5 p-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-heading text-2xl font-semibold text-green-700 dark:text-green-400">
                    Agreement signed{signedDateStr ? ` on ${signedDateStr}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A permanent copy of this signed proposal is kept on record for both parties.
                  </p>
                </div>
                <Button size="lg" variant="outline" onClick={() => window.print()} className="no-print">
                  <Printer className="mr-2 h-4 w-4" /> Download / Print
                </Button>
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-heading text-2xl font-semibold">Ready to get started?</p>
                  <p className="mt-1 text-sm opacity-90">Confirm your plan and we'll book your first lesson within 48 hours.</p>
                </div>
                <Button size="lg" variant="secondary" onClick={onConfirm}>
                  Confirm & get started
                </Button>
              </div>
            )}
          </Section>
        </main>
      </div>

      {/* Mobile sticky CTA */}
      {!signed && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
          <Button className="w-full" size="lg" onClick={onConfirm}>
            Confirm & get started
          </Button>
        </div>
      )}
      {signed && showPaymentBanner && onContinuePayment && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
          <Button className="w-full" size="lg" onClick={onContinuePayment}>
            Complete payment setup
          </Button>
        </div>
      )}

    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="font-heading text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
