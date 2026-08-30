import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import ProposalForm, {
  DEFAULT_LESSON_PRICE,
  LessonTimeRow,
  ProposalFormData,
  emptyLessonTime,
  headlinePriceOf,
} from '@/components/proposals/ProposalForm';

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prefill = (location.state as any)?.proposalPrefill as
    | {
        recipientName?: string;
        recipientEmail?: string;
        recipientPhone?: string;
        lessonType?: string;
        subject?: string;
        pricePerLesson?: number;
        paymentCycle?: string;
        contractTerm?: 'month_to_month' | '3_months' | '12_months';
        lessonTimes?: Array<{ day: string; time: string; duration: number; subject: string; price?: number }>;
      }
    | undefined;

  const defaultPrice = prefill?.pricePerLesson ?? DEFAULT_LESSON_PRICE;

  const prefilledTimes: LessonTimeRow[] = prefill?.lessonTimes?.length
    ? prefill.lessonTimes.map((lt) => ({ ...lt, price: lt.price ?? defaultPrice }))
    : [emptyLessonTime(defaultPrice)];

  const defaultValues: ProposalFormData = {
    recipientName: prefill?.recipientName || searchParams.get('name') || '',
    recipientEmail: prefill?.recipientEmail || searchParams.get('email') || '',
    recipientPhone: prefill?.recipientPhone || searchParams.get('phone') || '',
    lessonType: prefill?.lessonType || '',
    subject: prefill?.subject || searchParams.get('subject') || '',
    pricePerLesson: defaultPrice,
    paymentCycle: prefill?.paymentCycle || '',
    contractTerm: prefill?.contractTerm || 'month_to_month',
    dailyHomeworkOptIn: false,
    internalNotes: '',
    lessonTimes: prefilledTimes,
  };

  const onSubmit = async (data: ProposalFormData, validTimes: LessonTimeRow[]) => {
    setIsSubmitting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('create-lesson-proposal', {
        body: {
          ...data,
          recipientPhone: data.recipientPhone || null,
          dailyHomeworkOptIn: data.dailyHomeworkOptIn,
          internalNotes: data.internalNotes?.trim() || null,
          pricePerLesson: headlinePriceOf(validTimes),
          lessonTimes: validTimes,
        },
      });

      if (error) throw error;

      toast({
        title: 'Proposal Created!',
        description: `Proposal sent to ${data.recipientEmail}. Shareable link copied!`,
      });

      if (response?.proposalUrl) {
        await navigator.clipboard.writeText(response.proposalUrl);
      }

      navigate('/admin/proposals');
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 w-full flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Create Proposal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a personalized lesson proposal to send to parents/students
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/proposals')}
          className="inline-flex h-12 w-fit items-center gap-2 rounded-full border-2 border-foreground px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          <ArrowLeft className="h-4 w-4" />
          All Proposals
        </button>
      </div>

      <div className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
        <ProposalForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Create & Send Proposal"
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

