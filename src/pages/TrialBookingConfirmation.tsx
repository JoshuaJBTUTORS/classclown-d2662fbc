import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Home, Clock, Phone, Mail, Sparkles, Star } from 'lucide-react';

const TrialBookingConfirmation: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-28 h-[380px] w-[380px] rounded-full bg-pastel-mint/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-pastel-sky/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-20 h-[260px] w-[260px] rounded-full bg-pastel-butter/40 blur-3xl"
      />

      <div className="relative container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border-2 border-black bg-card p-6 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] sm:p-10">
            {/* Success badge */}
            <div className="text-center">
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                <Sparkles className="absolute -left-2 -top-1 h-5 w-5 text-amber-400" />
                <Star className="absolute -right-2 top-2 h-4 w-4 text-pastel-lilac" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-pastel-mint shadow-[0_4px_0_rgba(0,0,0,0.9)]">
                  <Check className="h-8 w-8 text-black" strokeWidth={3} />
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Request received
              </p>
              <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                Trial Lesson Request Submitted!
              </h1>
              <svg className="mx-auto mt-2 h-2.5 w-28" viewBox="0 0 112 10" fill="none">
                <path
                  d="M2 6C22 1.5 42 8.5 62 5s40-2 48 1"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-pastel-lilac"
                />
              </svg>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Thank you for your trial lesson request. We've received your
                information and will review it shortly.
              </p>
            </div>

            {/* What happens next */}
            <div className="mt-8 rounded-2xl border border-black/10 bg-pastel-butter/40 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-base font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-pastel-butter">
                  <Clock className="h-4 w-4" />
                </span>
                What happens next?
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/80">
                {[
                  'Our team will review your trial lesson request',
                  "We'll contact you within 24 hours to confirm your booking",
                  "Once approved, we'll assign a qualified tutor to your lesson",
                  "You'll receive the video lesson link before your appointment",
                  'Your trial lesson is completely free - no payment required',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="mt-4 rounded-2xl border border-black/10 bg-pastel-sky/40 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-base font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-pastel-sky">
                  <Phone className="h-4 w-4" />
                </span>
                Need help or have questions?
              </h2>
              <div className="mt-4 space-y-2.5 text-sm text-foreground/80">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-card">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <span>Call us: +44 01438582848</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-card">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span className="break-all">
                    Email: enquiries@classbeyondacademy.io
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/85"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBookingConfirmation;
