import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

interface CompleteSetupRequest {
  setupIntentId: string;
  proposalId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { setupIntentId, proposalId }: CompleteSetupRequest = await req.json();

    console.log('Completing proposal setup:', proposalId, setupIntentId);

    // Retrieve Setup Intent from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup Intent not succeeded');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      setupIntent.payment_method as string
    );

    console.log('Payment method retrieved:', paymentMethod.id);

    // Save payment method to database
    const { error: paymentError } = await supabaseClient
      .from('lesson_proposal_payment_methods')
      .insert({
        proposal_id: proposalId,
        stripe_setup_intent_id: setupIntentId,
        stripe_payment_method_id: paymentMethod.id,
        stripe_customer_id: setupIntent.customer as string,
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        billing_name: paymentMethod.billing_details.name,
        billing_email: paymentMethod.billing_details.email,
      });

    if (paymentError) {
      console.error('Error saving payment method:', paymentError);
      throw paymentError;
    }

    // Update proposal status to completed
    const { data: updatedProposal, error: updateError } = await supabaseClient
      .from('lesson_proposals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      throw updateError;
    }

    console.log('Proposal completed successfully:', proposalId);

    // Send notification email to Joshua
    try {
      const Resend = (await import('npm:resend@2.0.0')).Resend;
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

      const lessonTimesFormatted = Array.isArray(updatedProposal.lesson_times)
        ? updatedProposal.lesson_times.map((lt: any) => `${lt.day} at ${lt.time}`).join(', ')
        : 'Not specified';

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">🎉 New Proposal Completed!</h2>
          <p>A parent has successfully completed their lesson proposal setup:</p>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e3a5f;">Parent Details</h3>
            <p><strong>Name:</strong> ${updatedProposal.recipient_name}</p>
            <p><strong>Email:</strong> ${updatedProposal.recipient_email}</p>
            <p><strong>Phone:</strong> ${updatedProposal.recipient_phone || 'Not provided'}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Lesson Details</h3>
            <p><strong>Subject:</strong> ${updatedProposal.subject}</p>
            <p><strong>Price:</strong> £${updatedProposal.price_per_lesson} per lesson</p>
            <p><strong>Payment Cycle:</strong> ${updatedProposal.payment_cycle}</p>
            <p><strong>Lesson Times:</strong> ${lessonTimesFormatted}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="https://classclowncrm.com/admin/proposals/${updatedProposal.id}/view" 
               style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Proposal
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            This is an automated notification from the JB Tutors CRM system.
          </p>
        </div>
      `;

      await resend.emails.send({
        from: 'JB Tutors CRM <enquiries@jb-tutors.com>',
        to: ['joshua@jb-tutors.com'],
        subject: `✅ New Enrollment: ${updatedProposal.recipient_name} - ${updatedProposal.subject}`,
        html: emailHtml,
      });

      console.log('Admin notification email sent to Joshua');
    } catch (emailError: any) {
      console.error('Error sending admin notification email:', emailError);
      // Don't throw - we don't want to fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proposal completed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in complete-proposal-setup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
