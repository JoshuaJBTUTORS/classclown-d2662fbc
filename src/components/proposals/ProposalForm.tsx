import { ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, BookOpen, GripVertical } from 'lucide-react';
import OptimiseProposalPanel from '@/components/proposals/OptimiseProposalPanel';

export const lessonTimeSchema = z.object({
  day: z.string().min(1, 'Day is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  subject: z.string().min(1, 'Subject is required'),
  price: z.number().min(0, 'Price must be positive'),
});

export const proposalSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required').max(100),
  recipientEmail: z.string().email('Invalid email address').max(255),
  recipientPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  lessonType: z.string().min(1, 'Lesson type is required'),
  subject: z.string().min(1, 'Subject is required'),
  pricePerLesson: z.number().min(0).optional(),
  paymentCycle: z.string().min(1, 'Payment cycle is required'),
  contractTerm: z.enum(['month_to_month', '3_months', '12_months'], {
    required_error: 'Contract term is required',
  }),
  dailyHomeworkOptIn: z.boolean().default(false),
  internalNotes: z.string().max(5000).optional().or(z.literal('')),
  lessonTimes: z.array(lessonTimeSchema).min(1, 'At least one lesson time is required'),
});

export type ProposalFormData = z.infer<typeof proposalSchema>;
export type LessonTimeRow = { day: string; time: string; duration: number; subject: string; price: number };

export const DEFAULT_LESSON_PRICE = 45;

const sectionClass = 'rounded-[var(--radius-soft)] bg-pastel-sand/40 p-5 sm:p-6';
const sectionTitle = 'font-heading text-lg font-extrabold tracking-tight text-foreground mb-4';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const controlClass =
  'h-12 rounded-full border-2 border-foreground bg-background px-4 text-sm focus-visible:ring-0 focus-visible:ring-offset-0';
const menuClass = 'rounded-2xl border-2 border-foreground';
const outlinePill =
  'inline-flex h-12 items-center rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50';
const solidPill =
  'inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0';


export function emptyLessonTime(price = DEFAULT_LESSON_PRICE): LessonTimeRow {
  return { day: '', time: '', duration: 60, subject: '', price };
}

/** Legacy single-price column: keep the lowest row price so summaries stay sensible. */
export function headlinePriceOf(rows: LessonTimeRow[]): number {
  return rows.length ? Math.min(...rows.map((lt) => lt.price || 0)) : 0;
}

export function validLessonTimes(rows: LessonTimeRow[]): LessonTimeRow[] {
  return rows.filter((lt) => lt.day && lt.time && lt.subject);
}

interface ProposalFormProps {
  defaultValues: ProposalFormData;
  onSubmit: (data: ProposalFormData, lessonTimes: LessonTimeRow[]) => void | Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  /** Optional second action (e.g. "Save & Resend") that reuses the same validated data. */
  secondaryAction?: {
    label: string;
    loadingLabel?: string;
    icon?: ReactNode;
    isLoading: boolean;
    onClick: (data: ProposalFormData, lessonTimes: LessonTimeRow[]) => void | Promise<void>;
  };
}

export default function ProposalForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
  secondaryAction,
}: ProposalFormProps) {
  const initialTimes: LessonTimeRow[] = defaultValues.lessonTimes?.length
    ? (defaultValues.lessonTimes as LessonTimeRow[])
    : [emptyLessonTime(defaultValues.pricePerLesson ?? DEFAULT_LESSON_PRICE)];

  const [lessonTimes, setLessonTimes] = useState<LessonTimeRow[]>(initialTimes);
  const [rowIds, setRowIds] = useState<string[]>(() =>
    initialTimes.map(() => Math.random().toString(36).slice(2)),
  );
  const [numDrafts, setNumDrafts] = useState<Record<string, string>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);

  const newId = () => Math.random().toString(36).slice(2);

  const commit = (next: LessonTimeRow[]) => {
    setLessonTimes(next);
    form.setValue('lessonTimes', next);
  };

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { ...defaultValues, lessonTimes: initialTimes },
  });

  const addLessonTime = () => {
    const next = [...lessonTimes, emptyLessonTime(defaultValues.pricePerLesson ?? DEFAULT_LESSON_PRICE)];
    setRowIds((ids) => [...ids, newId()]);
    commit(next);
  };

  const removeLessonTime = (index: number) => {
    const next = lessonTimes.filter((_, i) => i !== index);
    setRowIds((ids) => ids.filter((_, i) => i !== index));
    commit(next);
  };

  const updateLessonTime = (index: number, field: keyof LessonTimeRow, value: string | number) => {
    const next = [...lessonTimes];
    next[index] = { ...next[index], [field]: value };
    commit(next);
  };

  const setNumericField = (
    index: number,
    field: 'price' | 'duration',
    raw: string,
    fallback: number,
  ) => {
    const key = `${rowIds[index]}-${field}`;
    setNumDrafts((d) => ({ ...d, [key]: raw }));
    const parsed = raw === '' ? fallback : field === 'price' ? parseFloat(raw) : parseInt(raw, 10);
    updateLessonTime(index, field, Number.isFinite(parsed) ? parsed : fallback);
  };

  const numericValue = (index: number, field: 'price' | 'duration') => {
    const key = `${rowIds[index]}-${field}`;
    const draft = numDrafts[key];
    if (draft !== undefined) return draft;
    return String(lessonTimes[index][field] ?? '');
  };

  const reorderRows = (from: number, to: number) => {
    if (from === to) return;
    const nextTimes = [...lessonTimes];
    const [movedTime] = nextTimes.splice(from, 1);
    nextTimes.splice(to, 0, movedTime);
    setRowIds((ids) => {
      const nextIds = [...ids];
      const [movedId] = nextIds.splice(from, 1);
      nextIds.splice(to, 0, movedId);
      return nextIds;
    });
    commit(nextTimes);
  };


  const handleSecondary = form.handleSubmit((data) => {
    secondaryAction?.onClick(data, validLessonTimes(lessonTimes));
  });

  const busy = isSubmitting || Boolean(secondaryAction?.isLoading);

  return (
    <>
      <OptimiseProposalPanel
        lessonTimes={lessonTimes}
        lessonType={form.watch('lessonType')}
        studentContext={form.watch('recipientName')}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => onSubmit(data, validLessonTimes(lessonTimes)))}
          className="space-y-6 pt-6"
        >
          <section className={sectionClass}>
            <h2 className={sectionTitle}>Recipient details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Recipient Name</FormLabel>
                    <FormControl>
                      <Input className={controlClass} placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Recipient Email</FormLabel>
                    <FormControl>
                      <Input className={controlClass} type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Recipient Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input className={controlClass} type="tel" placeholder="+44 7123 456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitle}>Lesson details &amp; pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Lesson Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select lesson type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={menuClass}>
                        <SelectItem value="1-to-1 Online">1-to-1 Online</SelectItem>
                        <SelectItem value="1-to-1 In-Person">1-to-1 In-Person</SelectItem>
                        <SelectItem value="Group Session">Small Group Session</SelectItem>
                        <SelectItem value="Large Group Session">Large Group Session</SelectItem>
                        <SelectItem value="Mixed">Mixed (1-to-1 &amp; Group)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Subject</FormLabel>
                    <FormControl>
                      <Input className={controlClass} placeholder="Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Payment Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select payment cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={menuClass}>
                        <SelectItem value="Per Lesson">Per Lesson</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Termly">Termly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Contract Term</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select contract term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={menuClass}>
                        <SelectItem value="month_to_month">Month to Month</SelectItem>
                        <SelectItem value="3_months">3 Months</SelectItem>
                        <SelectItem value="12_months">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="mt-3 rounded-[1.25rem] bg-background/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              During the term, sessions cannot be reduced and plans cannot be downgraded (upgrades are always
              allowed). Auto-renews at term end. Clients must give 30 days' notice before the end date to cancel.
            </p>
          </section>

          <section className={sectionClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={sectionTitle}>Lesson times</h2>
              <button type="button" onClick={addLessonTime} className={outlinePill}>
                <Plus className="mr-2 h-4 w-4" />
                Add Time
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {lessonTimes.map((lessonTime, index) => (
                <div
                  key={rowIds[index] ?? index}
                  draggable={draggableIndex === index}
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => setDragOverIndex((i) => (i === index ? null : i))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderRows(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                    setDraggableIndex(null);
                  }}
                  className={`rounded-[1.25rem] bg-background/70 p-4 transition-all ${
                    dragIndex === index ? 'opacity-50' : ''
                  } ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-foreground' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-7 flex h-11 w-8 shrink-0 cursor-grab items-center justify-center rounded-full text-muted-foreground active:cursor-grabbing"
                      title="Drag to reorder"
                      onMouseDown={() => setDraggableIndex(index)}
                      onMouseUp={() => setDraggableIndex(null)}
                      onTouchStart={() => setDraggableIndex(index)}
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

                      <div>
                        <FormLabel className={labelClass}>Day</FormLabel>
                        <Select value={lessonTime.day} onValueChange={(value) => updateLessonTime(index, 'day', value)}>
                          <SelectTrigger className={controlClass}>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent className={menuClass}>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FormLabel className={labelClass}>Time</FormLabel>
                        <Input
                          className={controlClass}
                          type="time"
                          value={lessonTime.time}
                          onChange={(e) => updateLessonTime(index, 'time', e.target.value)}
                        />
                      </div>

                      <div>
                        <FormLabel className={labelClass}>Duration (min)</FormLabel>
                        <Input
                          className={`${controlClass} tabular-nums`}
                          type="number"
                          inputMode="numeric"
                          value={numericValue(index, 'duration')}
                          onChange={(e) => setNumericField(index, 'duration', e.target.value, 60)}
                        />

                      </div>

                      <div>
                        <FormLabel className={labelClass}>Subject</FormLabel>
                        <Input
                          className={controlClass}
                          placeholder="e.g., Maths, English"
                          value={lessonTime.subject}
                          onChange={(e) => updateLessonTime(index, 'subject', e.target.value)}
                        />
                      </div>

                      <div>
                        <FormLabel className={labelClass}>Price (£)</FormLabel>
                        <Input
                          className={`${controlClass} text-right tabular-nums`}
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={numericValue(index, 'price')}
                          onChange={(e) => setNumericField(index, 'price', e.target.value, 0)}
                        />

                      </div>
                    </div>

                    {lessonTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLessonTime(index)}
                        title="Remove lesson time"
                        className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-destructive text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="lessonTimes"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitle}>Options &amp; notes</h2>

            {/* Daily Homework Practice Option */}
            <div className="rounded-[1.25rem] bg-background/70 p-4">
              <FormField
                control={form.control}
                name="dailyHomeworkOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        className="mt-1 h-5 w-5 rounded-md border-2 border-foreground"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <FormLabel className="flex cursor-pointer items-center gap-2 text-base font-semibold">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pastel-butter">
                            <BookOpen className="h-4 w-4 text-foreground" />
                          </span>
                          Include Daily Homework Practice
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Daily homework assignments across all subjects
                        </p>
                      </div>
                      <span className="rounded-full bg-pastel-mint px-3 py-1 text-sm font-semibold tabular-nums text-foreground">
                        £12.99/mo
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Internal notes */}
            <FormField
              control={form.control}
              name="internalNotes"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className={labelClass}>Internal notes (not shown to the client)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      className="rounded-[1.25rem] border-2 border-foreground bg-background px-4 py-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Anything the onboarding team needs to know about this proposal..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    These notes are shown to staff during Cleo Onboarding, never to the recipient.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCancel} className={outlinePill}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={solidPill}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
            {secondaryAction && (
              <button type="button" disabled={busy} onClick={handleSecondary} className={outlinePill}>
                {secondaryAction.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {secondaryAction.loadingLabel || 'Sending...'}
                  </>
                ) : (
                  <>
                    {secondaryAction.icon}
                    {secondaryAction.label}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </Form>
    </>
  );
}

