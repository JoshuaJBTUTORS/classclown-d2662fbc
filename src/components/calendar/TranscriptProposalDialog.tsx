import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, Quote, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriceCandidate {
  value: string | null;
  quote: string | null;
  timestamp: string | null;
  reason_rejected: string | null;
}

export interface ExtractedField {
  value: string | null;
  quote: string | null;
  timestamp: string | null;
  confidence: 'high' | 'medium' | 'low' | 'missing';
  candidates?: PriceCandidate[];
}

export interface ExtractedLessonTime {
  day: string;
  time: string;
  duration: number;
  subject: string;
  quote?: string | null;
  timestamp?: string | null;
  confidence?: string;
}

export interface ProposalDraft {
  found_discovery: boolean;
  summary: string;
  fields: Record<string, ExtractedField>;
  lesson_times: ExtractedLessonTime[];
  notes: Array<{ kind: string; text: string; timestamp: string | null }>;
}

export interface ProposalPrefill {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  lessonType: string;
  subject: string;
  pricePerLesson: number;
  paymentCycle: string;
  contractTerm: 'month_to_month' | '3_months' | '12_months' | '24_months';
  lessonTimes: Array<{ day: string; time: string; duration: number; subject: string }>;
}

const STANDARD_RATE = { min: 18, max: 60 };

const FIELD_LABELS: Record<string, string> = {
  recipient_name: 'Recipient name',
  recipient_email: 'Recipient email',
  recipient_phone: 'Recipient phone',
  student_name: 'Student',
  year_group: 'Year group',
  year_band: 'Year band',
  subjects: 'Subjects',
  exam_boards: 'Exam boards',
  lesson_type: 'Lesson format',
  lessons_per_week: 'Lessons per week',
  preferred_times: 'Preferred times',
  blocked_days: 'Unavailable days',
  rotation_pattern: 'Rotation pattern',
  contract_term: 'Contract term',
  price_per_lesson: 'Price per lesson',
  payment_cycle: 'Payment cycle',
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

function confidenceBadge(confidence: string) {
  if (confidence === 'high') return <Badge variant="secondary">Confident</Badge>;
  if (confidence === 'medium') return <Badge variant="outline">Check</Badge>;
  if (confidence === 'low')
    return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300">Low confidence</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not mentioned</Badge>;
}

function normaliseTerm(value: string | null): 'month_to_month' | '3_months' | '12_months' | '24_months' {
  const v = (value || '').toLowerCase();
  if (v.includes('24')) return '24_months';
  if (v.includes('12')) return '12_months';
  if (v.includes('3')) return '3_months';
  return 'month_to_month';
}

function normaliseLessonType(value: string | null, fallback: string): string {
  const v = (value || fallback || '').toLowerCase();
  if (v.includes('group')) return 'Group Session';
  if (v.includes('person')) return '1-to-1 In-Person';
  if (v.includes('mixed')) return 'Mixed';
  return '1-to-1 Online';
}

function normalisePaymentCycle(value: string | null): string {
  const v = (value || '').toLowerCase();
  if (v.includes('term')) return 'Termly';
  if (v.includes('lesson')) return 'Per Lesson';
  return 'Monthly';
}

function parsePrice(value: string | null): number {
  if (!value) return 45;
  const match = value.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 45;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  lessonSubject?: string | null;
  lessonType?: string | null;
  fallbackPrefill: ProposalPrefill;
  onUseDraft: (prefill: ProposalPrefill) => void;
  onSkip: () => void;
}

const TranscriptProposalDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  lessonId,
  lessonSubject,
  lessonType,
  fallbackPrefill,
  onUseDraft,
  onSkip,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [priceOverride, setPriceOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !lessonId) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setDraft(null);
      setErrorMessage(null);
      setPriceOverride(null);
      try {
        const { data, error } = await supabase.functions.invoke('draft-proposal-from-transcript', {
          body: { lessonId },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) {
          setErrorMessage(data.message || 'Could not read the transcript for this lesson.');
          return;
        }
        setDraft(data.draft as ProposalDraft);
      } catch (e: any) {
        if (!cancelled) setErrorMessage(e.message || 'Failed to read the transcript.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, lessonId]);

  const buildPrefill = (): ProposalPrefill => {
    if (!draft) return fallbackPrefill;
    const f = draft.fields || {};
    const price = parsePrice(priceOverride ?? f.price_per_lesson?.value ?? null);
    return {
      recipientName: f.recipient_name?.value || fallbackPrefill.recipientName,
      recipientEmail: f.recipient_email?.value || fallbackPrefill.recipientEmail,
      recipientPhone: f.recipient_phone?.value || fallbackPrefill.recipientPhone,
      lessonType: normaliseLessonType(f.lesson_type?.value ?? null, lessonType || ''),
      subject: lessonSubject || f.subjects?.value || fallbackPrefill.subject,
      pricePerLesson: price,
      paymentCycle: normalisePaymentCycle(f.payment_cycle?.value ?? null),
      contractTerm: normaliseTerm(f.contract_term?.value ?? null),
      lessonTimes: (draft.lesson_times || [])
        .filter((lt) => lt.day && lt.time && lt.subject)
        .map((lt) => ({
          day: lt.day,
          time: lt.time,
          duration: lt.duration || 60,
          subject: lt.subject,
        })),
    };
  };

  const priceField = draft?.fields?.price_per_lesson;
  const selectedPriceValue = priceOverride ?? priceField?.value ?? null;
  const price = draft ? parsePrice(selectedPriceValue) : null;
  const priceOutOfRange =
    price !== null &&
    selectedPriceValue &&
    (price < STANDARD_RATE.min || price > STANDARD_RATE.max);

  const priceCandidates = (priceField?.candidates || []).filter((c) => c?.value);
  const isSelectedCandidate = (c: PriceCandidate) =>
    parsePrice(c.value) === parsePrice(selectedPriceValue);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Draft proposal from the trial conversation
          </DialogTitle>
          <DialogDescription>
            Everything below was read from the recording of this session. Review it, then carry it into the proposal
            builder.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Reading the transcript…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">{errorMessage}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSkip}>
                Continue to blank proposal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {!isLoading && draft && (
          <div className="space-y-5">
            {!draft.found_discovery && (
              <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900">
                  No discovery conversation for this student could be found in the recording. The fields below may be
                  incomplete or belong to another session sharing the same room.
                </div>
              </div>
            )}

            {draft.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{draft.summary}</p>
            )}

            {priceOutOfRange && (
              <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900">
                  The quoted price of £{price} sits outside the usual £{STANDARD_RATE.min}–£{STANDARD_RATE.max} range.
                  Please confirm it before sending.
                </div>
              </div>
            )}

            <div className="space-y-2">
              {FIELD_ORDER.map((key) => {
                const field = draft.fields?.[key];
                if (!field) return null;
                const isPrice = key === 'price_per_lesson';
                const displayValue = isPrice ? selectedPriceValue : field.value;
                const flagged = field.confidence === 'low' || field.confidence === 'missing';
                return (
                  <div
                    key={key}
                    className={`rounded-md border p-3 ${flagged ? 'border-amber-300 bg-amber-50/60' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{FIELD_LABELS[key]}</p>
                        <p className="text-sm font-medium break-words">
                          {displayValue || <span className="text-muted-foreground italic">Not mentioned</span>}
                        </p>
                      </div>
                      {confidenceBadge(field.confidence)}
                    </div>
                    {field.quote && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                        <Quote className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>
                          {field.timestamp ? <span className="font-mono mr-1">[{field.timestamp}]</span> : null}
                          “{field.quote}”
                        </span>
                      </div>
                    )}
                    {isPrice && priceCandidates.length > 1 && (
                      <div className="mt-3 border-t pt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Other prices mentioned in the call
                        </p>
                        <div className="space-y-2">
                          {priceCandidates.map((c, i) => {
                            const selected = isSelectedCandidate(c);
                            return (
                              <div
                                key={i}
                                className={`rounded-md border p-2 text-xs ${
                                  selected ? 'border-primary/50 bg-primary/5' : 'bg-background'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium">
                                    {c.value}
                                    {c.timestamp ? (
                                      <span className="font-mono text-muted-foreground ml-1">[{c.timestamp}]</span>
                                    ) : null}
                                  </span>
                                  {selected ? (
                                    <Badge variant="secondary">Using this</Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => setPriceOverride(c.value)}
                                    >
                                      Use this price
                                    </Button>
                                  )}
                                </div>
                                {c.quote && (
                                  <p className="mt-1 text-muted-foreground">“{c.quote}”</p>
                                )}
                                {c.reason_rejected && (
                                  <p className="mt-1 text-muted-foreground italic">{c.reason_rejected}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-2">Weekly sessions discussed</p>
              {draft.lesson_times?.length ? (
                <div className="space-y-2">
                  {draft.lesson_times.map((lt, i) => (
                    <div key={i} className="rounded-md border p-3 bg-muted/30">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {lt.day} at {lt.time} · {lt.duration || 60} min · {lt.subject}
                        </p>
                        {lt.confidence ? confidenceBadge(lt.confidence) : null}
                      </div>
                      {lt.quote && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                          <Quote className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>
                            {lt.timestamp ? <span className="font-mono mr-1">[{lt.timestamp}]</span> : null}“{lt.quote}”
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific times were agreed in the conversation.</p>
              )}
            </div>

            {draft.notes?.length ? (
              <div>
                <p className="text-sm font-semibold mb-2">Notes from the call</p>
                <ul className="space-y-1">
                  {draft.notes.map((n, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      <span className="capitalize font-medium text-foreground">{n.kind.replace('_', ' ')}:</span>{' '}
                      {n.text}
                      {n.timestamp ? <span className="font-mono text-xs ml-1">[{n.timestamp}]</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onSkip}>
                Start blank instead
              </Button>
              <Button
                onClick={() => {
                  const prefill = buildPrefill();
                  toast.success('Proposal prefilled from the transcript');
                  onUseDraft(prefill);
                }}
              >
                Use for proposal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptProposalDialog;
