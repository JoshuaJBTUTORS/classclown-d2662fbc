import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface AgreementStepProps {
  proposal: any;
  onAgree: () => void;
  onBack: () => void;
}

export default function AgreementStep({ proposal, onAgree, onBack }: AgreementStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgree = async () => {
    if (!agreed) {
      toast({
        title: 'Agreement Required',
        description: 'Please read and accept the terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get IP address (simplified - in production use a proper service)
      const ipAddress = 'Unknown';
      const userAgent = navigator.userAgent;

      // Create signature record
      const { error: signatureError } = await supabase
        .from('lesson_proposal_signatures')
        .insert({
          proposal_id: proposal.id,
          signer_name: proposal.recipient_name,
          signer_email: proposal.recipient_email,
          ip_address: ipAddress,
          user_agent: userAgent,
          agreement_text: TERMS_AND_CONDITIONS,
        });

      if (signatureError) throw signatureError;

      // Update proposal status
      const { error: updateError } = await supabase
        .from('lesson_proposals')
        .update({
          status: 'agreed',
          agreed_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      toast({
        title: 'Agreement Accepted',
        description: 'Proceeding to payment setup...',
      });

      onAgree();
    } catch (error: any) {
      console.error('Error accepting agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept agreement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6 md:py-12">
      <Card className="p-8 md:p-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Terms & Conditions</h1>
          <p className="text-muted-foreground">Please review and accept our terms to continue</p>
        </div>

        <div className="bg-muted/50 p-4 md:p-6 rounded-lg max-h-96 overflow-y-auto space-y-4 text-sm">
          <div dangerouslySetInnerHTML={{ __html: TERMS_AND_CONDITIONS }} />
        </div>

        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
          By signing below, you confirm that you have reviewed and accepted the programme start date, lesson schedule,
          minimum term, payment arrangements, cancellation policy and teacher allocation terms.
        </div>

        <div className="flex items-start gap-3 p-4 border rounded-lg leading-relaxed">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label htmlFor="agree" className="text-sm cursor-pointer text-left">
            I have read and agree to the Terms & Conditions outlined above. I understand that by clicking
            "I Agree," I am entering into a binding agreement with Class Beyond.
          </label>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="w-full md:w-auto">
            Back to Proposal
          </Button>
          <Button onClick={handleAgree} disabled={!agreed || isSubmitting} className="w-full md:flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I Agree - Continue to Payment Setup
          </Button>
        </div>
      </Card>
    </div>
  );
}

const TERMS_AND_CONDITIONS = `
<h3 class="font-semibold text-base mb-2">1. Services Provided</h3>
<p class="mb-4">Class Beyond ("we," "our," or "the Company") agrees to provide tutoring services as outlined in this proposal. Services include personalized instruction, progress monitoring, and educational support tailored to the student's needs.</p>

<h3 class="font-semibold text-base mb-2">2. Programme Start Date and Term</h3>
<p class="mb-4">Your programme will begin on the programme start date stated in this proposal, and lessons scheduled from this date will form part of your programme unless an alternative start date has been agreed by Class Beyond Academy in writing beforehand. This agreement is for the minimum term stated in this proposal, beginning on the programme start date.</p>

<h3 class="font-semibold text-base mb-2">3. Lesson Schedule</h3>
<p class="mb-4">Lessons will take place on the agreed days and times set out in this proposal. Lesson times may occasionally be adjusted by mutual agreement or where operationally necessary.</p>

<h3 class="font-semibold text-base mb-2">4. Teacher Allocation</h3>
<p class="mb-4">Class Beyond Academy assigns teachers based on subject expertise, availability and student needs. We aim to provide consistency of teaching wherever possible; however, the programme is provided by Class Beyond Academy and does not guarantee lessons with any particular individual teacher.</p>
<p class="mb-4">Where a teacher is unavailable due to illness, absence or other circumstances, Class Beyond Academy may provide another suitable teacher or reschedule the lesson.</p>

<h3 class="font-semibold text-base mb-2">5. Payment</h3>
<p class="mb-4">No payment is required before the programme begins. Your first payment will be collected following your child's first scheduled lesson. The programme itself nevertheless begins on the programme start date shown above.</p>

<h3 class="font-semibold text-base mb-2">6. Missed Lessons / No-Shows</h3>
<p class="mb-4">A scheduled lesson that the student does not attend will still count as a delivered programme session unless it has been cancelled or rearranged in accordance with our cancellation policy.</p>
<p class="mb-4">We require at least 24 hours' notice to cancel or rearrange a lesson. Lessons missed with less than 24 hours' notice may be charged and may not be rescheduled.</p>

<h3 class="font-semibold text-base mb-2">7. Class Beyond Academy Cancellations</h3>
<p class="mb-4">If Class Beyond Academy is unable to provide a scheduled lesson and cannot provide a suitable alternative teacher, the lesson will be rearranged and will not be treated as a student absence.</p>

<h3 class="font-semibold text-base mb-2">8. Substitute Teachers</h3>
<p class="mb-4">On occasion, another member of our teaching team may deliver a lesson due to teacher illness, annual leave, scheduling requirements or other unforeseen circumstances. The use of a substitute teacher does not constitute cancellation of the programme.</p>

<h3 class="font-semibold text-base mb-2">9. Changing Your Start Date</h3>
<p class="mb-4">Requests to delay or change the programme start date must be agreed with Class Beyond Academy in writing before the scheduled start date. A requested change is not confirmed until acknowledged by us in writing.</p>

<h3 class="font-semibold text-base mb-2">10. Parent / Guardian Responsibility</h3>
<p class="mb-4">Parents/guardians are responsible for ensuring that the student is available and able to access lessons at the scheduled time.</p>

<h3 class="font-semibold text-base mb-2">11. Cancellation Policy</h3>
<p class="mb-4">Lessons must be cancelled at least 24 hours in advance to avoid being charged. Cancellations with less than 24 hours notice will be charged in full. Rescheduling is subject to tutor availability.</p>

<h3 class="font-semibold text-base mb-2">12. Attendance and Progress</h3>
<p class="mb-4">Regular attendance is crucial for academic progress. Parents/guardians will receive periodic progress reports. Students are expected to complete assigned homework and participate actively in lessons.</p>

<h3 class="font-semibold text-base mb-2">13. Code of Conduct</h3>
<p class="mb-4">All parties agree to maintain a respectful learning environment. Inappropriate behavior, harassment, or failure to comply with our code of conduct may result in termination of services without refund.</p>

<h3 class="font-semibold text-base mb-2">14. Liability</h3>
<p class="mb-4">While we strive to provide excellent educational services, Class Beyond cannot guarantee specific academic outcomes. Our liability is limited to the fees paid for services rendered.</p>

<h3 class="font-semibold text-base mb-2">15. Data Protection</h3>
<p class="mb-4">We are committed to protecting your privacy. Personal information will be processed in accordance with GDPR and our Privacy Policy. We will never share your data with third parties without consent.</p>

<h3 class="font-semibold text-base mb-2">16. Termination</h3>
<p class="mb-4">Either party may terminate this agreement with 1 month (30 days) written notice. Prepaid fees for unused lessons will be refunded on a pro-rata basis, less any administrative fees.</p>

<h3 class="font-semibold text-base mb-2">17. Modifications</h3>
<p class="mb-4">We reserve the right to modify these terms with reasonable notice. Continued use of our services after notification constitutes acceptance of revised terms.</p>

<h3 class="font-semibold text-base mb-2">18. Governing Law</h3>
<p class="mb-4">This agreement is governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
`;
