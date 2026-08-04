import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Lesson Proposal</CardTitle>
          <CardDescription>
            Create a personalized lesson proposal to send to parents/students
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ProposalForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Create & Send Proposal"
            onCancel={() => navigate(-1)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
