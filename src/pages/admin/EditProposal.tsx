import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';
import LoadingHand from '@/components/ui/loading-hand';
import ProposalForm, {
  DEFAULT_LESSON_PRICE,
  LessonTimeRow,
  ProposalFormData,
  emptyLessonTime,
  headlinePriceOf,
} from '@/components/proposals/ProposalForm';

export default function EditProposal() {
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<ProposalFormData | null>(null);

  useEffect(() => {
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const loadProposal = async () => {
    if (!proposalId) {
      toast({ title: 'Error', description: 'Invalid proposal ID', variant: 'destructive' });
      navigate('/admin/proposals');
      return;
    }

    try {
      const { data: proposal, error } = await supabase
        .from('lesson_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      if (!proposal) {
        toast({ title: 'Error', description: 'Proposal not found', variant: 'destructive' });
        navigate('/admin/proposals');
        return;
      }

      // Older proposals have no per-row price: fall back to the legacy single price column.
      const fallbackPrice = Number(proposal.price_per_lesson) || DEFAULT_LESSON_PRICE;

      const parsedLessonTimes: LessonTimeRow[] =
        proposal.lesson_times && Array.isArray(proposal.lesson_times) && proposal.lesson_times.length
          ? (proposal.lesson_times as any[]).map((lt: any) => ({
              day: lt.day || '',
              time: lt.time || '',
              duration: lt.duration || 60,
              subject: lt.subject || proposal.subject || '',
              price: typeof lt.price === 'number' ? lt.price : fallbackPrice,
            }))
          : [{ ...emptyLessonTime(fallbackPrice), subject: proposal.subject || '' }];

      setDefaultValues({
        recipientName: proposal.recipient_name || '',
        recipientEmail: proposal.recipient_email || '',
        recipientPhone: proposal.recipient_phone || '',
        lessonType: proposal.lesson_type || '',
        subject: proposal.subject || '',
        pricePerLesson: fallbackPrice,
        paymentCycle: proposal.payment_cycle || '',
        contractTerm:
          ((proposal as any).contract_term as 'month_to_month' | '3_months' | '12_months' | '24_months') || 'month_to_month',
        programmeStartDate: ((proposal as any).programme_start_date as string) || '',
        dailyHomeworkOptIn: Boolean((proposal as any).daily_homework_opt_in),
        internalNotes: (proposal as any).internal_notes || '',
        lessonTimes: parsedLessonTimes,
      });
    } catch (error: any) {
      console.error('Error loading proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load proposal',
        variant: 'destructive',
      });
      navigate('/admin/proposals');
    } finally {
      setIsLoading(false);
    }
  };

  const buildBody = (data: ProposalFormData, validTimes: LessonTimeRow[]) => ({
    proposalId,
    ...data,
    recipientPhone: data.recipientPhone || null,
    dailyHomeworkOptIn: data.dailyHomeworkOptIn,
    programmeStartDate: data.programmeStartDate || null,
    internalNotes: data.internalNotes?.trim() || null,
    pricePerLesson: headlinePriceOf(validTimes),
    lessonTimes: validTimes,
  });

  const onSubmit = async (data: ProposalFormData, validTimes: LessonTimeRow[]) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('update-lesson-proposal', {
        body: buildBody(data, validTimes),
      });

      if (error) throw error;

      toast({ title: 'Proposal Updated!', description: 'The proposal has been updated successfully.' });
      navigate('/admin/proposals');
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update proposal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndResend = async (data: ProposalFormData, validTimes: LessonTimeRow[]) => {
    setIsResending(true);
    try {
      const { error: updateError } = await supabase.functions.invoke('update-lesson-proposal', {
        body: buildBody(data, validTimes),
      });

      if (updateError) throw updateError;

      const { data: resendData, error: resendError } = await supabase.functions.invoke('send-proposal-email', {
        body: {
          proposalId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
        },
      });

      if (resendError) throw resendError;

      let successMessage = `Email sent to ${data.recipientEmail}`;
      if (resendData?.whatsappSent && data.recipientPhone) {
        successMessage += `\nWhatsApp sent to ${data.recipientPhone}`;
      } else if (data.recipientPhone) {
        successMessage += `\nWhatsApp failed: ${resendData?.whatsappError || 'Unknown error'}`;
      }

      toast({ title: 'Proposal Updated & Resent!', description: successMessage });
      navigate('/admin/proposals');
    } catch (error: any) {
      console.error('Error updating and resending proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update and resend proposal',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading || !defaultValues) {
    return (
      <div className="container max-w-4xl py-8 flex justify-center items-center">
        <LoadingHand fullScreen />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Lesson Proposal</CardTitle>
          <CardDescription>Update the lesson proposal details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Update Proposal"
            onCancel={() => navigate('/admin/proposals')}
            secondaryAction={{
              label: 'Save & Resend',
              loadingLabel: 'Sending...',
              icon: <Mail className="mr-2 h-4 w-4" />,
              isLoading: isResending,
              onClick: handleSaveAndResend,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
