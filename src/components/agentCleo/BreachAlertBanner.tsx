import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTutorBreaches, TutorBreach } from '@/hooks/useTutorBreaches';

const CATEGORY_LABELS: Record<string, string> = {
  personal_information: 'Personal information',
  inappropriate_communication: 'Inappropriate communication',
  professional_misconduct: 'Professional misconduct',
  safeguarding: 'Safeguarding',
  discrimination_harassment: 'Discrimination / harassment',
};

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-yellow-50 text-yellow-800 border-yellow-300',
};

const BreachCard: React.FC<{ breach: TutorBreach; onDismiss: (id: string) => void }> = ({ breach, onDismiss }) => {
  const [open, setOpen] = useState(false);
  const date = breach.lesson_date ? new Date(breach.lesson_date).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }) : null;

  return (
    <div className="rounded-2xl border-2 border-black/80 bg-white dark:bg-[#1c1c22] p-4">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${SEVERITY_STYLES[breach.severity] ?? SEVERITY_STYLES.medium}`}>
          {breach.severity}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {breach.tutor_name || 'Unknown tutor'} — {CATEGORY_LABELS[breach.category] ?? breach.category.replace(/_/g, ' ')}
          </div>
          <div className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mt-0.5">
            {[breach.lesson_title, date, breach.students].filter(Boolean).join(' · ')}
          </div>
          <p className="text-sm mt-2">{breach.summary}</p>

          {breach.evidence.length > 0 && (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
              >
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide transcript evidence' : `Show transcript evidence (${breach.evidence.length})`}
              </button>
              {open && (
                <ul className="mt-2 space-y-1">
                  {breach.evidence.map((e, i) => (
                    <li key={i} className="text-xs italic text-[#55555e] dark:text-[#c5c5d2] border-l-2 border-black/20 dark:border-white/20 pl-2">
                      “{e}”
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => onDismiss(breach.id)}
          aria-label="Dismiss this alert"
          className="shrink-0 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const BreachAlertBanner: React.FC = () => {
  const { breaches, loading, dismiss, dismissAll } = useTutorBreaches();

  if (loading || breaches.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mb-6 rounded-3xl border-2 border-black bg-[#ffe9e6] dark:bg-[#2a1a1a] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="w-5 h-5" />
          {breaches.length} potential tutor breach{breaches.length === 1 ? '' : 'es'} detected
        </div>
        <button
          onClick={dismissAll}
          className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          Dismiss all
        </button>
      </div>
      <p className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mb-3">
        AI-flagged from lesson transcripts. Verify before taking any action.
      </p>
      <div className="space-y-3">
        {breaches.map((b) => (
          <BreachCard key={b.id} breach={b} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  );
};

export default BreachAlertBanner;
