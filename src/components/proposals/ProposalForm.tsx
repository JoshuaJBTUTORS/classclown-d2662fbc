import { ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, BookOpen } from 'lucide-react';
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

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { ...defaultValues, lessonTimes: initialTimes },
  });

  const addLessonTime = () => {
    const next = [...lessonTimes, emptyLessonTime(defaultValues.pricePerLesson ?? DEFAULT_LESSON_PRICE)];
    setLessonTimes(next);
    form.setValue('lessonTimes', next);
  };

  const removeLessonTime = (index: number) => {
    const next = lessonTimes.filter((_, i) => i !== index);
    setLessonTimes(next);
    form.setValue('lessonTimes', next);
  };

  const updateLessonTime = (index: number, field: keyof LessonTimeRow, value: string | number) => {
    const next = [...lessonTimes];
    next[index] = { ...next[index], [field]: value };
    setLessonTimes(next);
    form.setValue('lessonTimes', next);
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
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
                  <FormLabel>Recipient Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+44 7123 456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lessonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Mathematics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Cycle</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Per Lesson">Per Lesson</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Termly">Termly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contractTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Term</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="month_to_month">Month to Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="12_months">12 Months</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  During the term, sessions cannot be reduced and plans cannot be downgraded (upgrades are always
                  allowed). Auto-renews at term end. Clients must give 30 days' notice before the end date to cancel.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Lesson Times</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addLessonTime}>
                <Plus className="h-4 w-4 mr-2" />
                Add Time
              </Button>
            </div>

            {lessonTimes.map((lessonTime, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <FormLabel>Day</FormLabel>
                    <Select value={lessonTime.day} onValueChange={(value) => updateLessonTime(index, 'day', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>Time</FormLabel>
                    <Input
                      type="time"
                      value={lessonTime.time}
                      onChange={(e) => updateLessonTime(index, 'time', e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel>Duration (min)</FormLabel>
                    <Input
                      type="number"
                      value={lessonTime.duration}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateLessonTime(index, 'duration', value === '' ? 60 : parseInt(value) || 60);
                      }}
                    />
                  </div>

                  <div>
                    <FormLabel>Subject</FormLabel>
                    <Input
                      placeholder="e.g., Maths, English"
                      value={lessonTime.subject}
                      onChange={(e) => updateLessonTime(index, 'subject', e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel>Price (£)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={lessonTime.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateLessonTime(index, 'price', value === '' ? 0 : parseFloat(value) || 0);
                      }}
                    />
                  </div>
                </div>

                {lessonTimes.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLessonTime(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            <FormField
              control={form.control}
              name="lessonTimes"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Daily Homework Practice Option */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <FormField
              control={form.control}
              name="dailyHomeworkOptIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base font-medium flex items-center gap-2 cursor-pointer">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Include Daily Homework Practice
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Daily homework assignments across all subjects
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
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
              <FormItem>
                <FormLabel>Internal notes (not shown to the client)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
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

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
            {secondaryAction && (
              <Button type="button" variant="secondary" disabled={busy} onClick={handleSecondary}>
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
              </Button>
            )}
          </div>
        </form>
      </Form>
    </>
  );
}
