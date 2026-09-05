import React, { useState } from 'react';
import { TrendingDown, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useStudentChurnRisks, StudentChurnRisk } from '@/hooks/useStudentChurnRisks';

const LEVEL_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-yellow-50 text-yellow-800 border-yellow-300',
};

const RiskCard: React.FC<{ risk: StudentChurnRisk; onDismiss: (id: string) => void }> = ({ risk, onDismiss }) => {
  const [open, setOpen] = useState(false);

  const metrics = [
    risk.avg_confidence != null ? `Confidence ${risk.avg_confidence}/10` : null,
    risk.avg_engagement != null ? `Engagement ${risk.avg_engagement}/10` : null,
    risk.avg_speaking_pct != null ? `Talk time ${risk.avg_speaking_pct}%` : null,
    risk.missed_streak > 0 ? `${risk.missed_streak} missed in a row` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="rounded-2xl border-2 border-black/80 bg-white dark:bg-[#1c1c22] p-4">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${LEVEL_STYLES[risk.risk_level] ?? LEVEL_STYLES.medium}`}>
          {risk.risk_level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {risk.student_name || 'Unknown student'}
            {risk.parent_name ? ` — parent: ${risk.parent_name}` : ''}
          </div>
          <div className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mt-0.5">{metrics}</div>

          <ul className="mt-2 space-y-1">
            {risk.reasons.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="text-[#55555e] dark:text-[#c5c5d2]"> — {r.detail}</span>
              </li>
            ))}
          </ul>

          {risk.lessons_considered.length > 0 && (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
              >
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide lessons reviewed' : `Show lessons reviewed (${risk.lessons_considered.length})`}
              </button>
              {open && (
                <ul className="mt-2 space-y-1">
                  {risk.lessons_considered.map((l) => (
                    <li key={l.lesson_id} className="text-xs text-[#55555e] dark:text-[#c5c5d2] border-l-2 border-black/20 dark:border-white/20 pl-2">
                      {[
                        l.date ? new Date(l.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
                        l.title,
                        l.subject,
                        l.missed ? 'MISSED' : null,
                      ].filter(Boolean).join(' · ')}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {risk.parent_email && (
            <div className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mt-2">{risk.parent_email}</div>
          )}
        </div>
        <button
          onClick={() => onDismiss(risk.id)}
          aria-label="Dismiss this alert"
          className="shrink-0 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ChurnRiskBanner: React.FC = () => {
  const { risks, loading, dismiss, dismissAll } = useStudentChurnRisks();

  if (loading || risks.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mb-6 rounded-3xl border-2 border-black bg-[#fff4e0] dark:bg-[#2a2318] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-bold">
          <TrendingDown className="w-5 h-5" />
          {risks.length} student{risks.length === 1 ? '' : 's'} at risk of churning
        </div>
        <button
          onClick={dismissAll}
          className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          Dismiss all
        </button>
      </div>
      <p className="text-xs text-[#6b6b76] dark:text-[#8e8ea0] mb-3">
        Based on attendance, confidence, talk time and engagement against groupmates. Check before reaching out.
      </p>
      <div className="space-y-3">
        {risks.map((r) => (
          <RiskCard key={r.id} risk={r} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  );
};

export default ChurnRiskBanner;
