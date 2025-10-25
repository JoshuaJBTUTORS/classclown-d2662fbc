import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@2.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ReminderEmail } from './_templates/reminder-email.tsx';
import { AgreedReminderEmail } from './_templates/agreed-reminder-email.tsx';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Starting daily proposal reminders...');

    // Fetch proposals with status sent, viewed, or agreed
    const { data: proposals, error: fetchError } = await supabaseClient
      .from('lesson_proposals')
      .select('*')
      .in('status', ['sent', 'viewed', 'agreed']);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${proposals?.length || 0} proposals to process`);

    const results = {
      total: proposals?.length || 0,
      emailsSent: 0,
      whatsappSent: 0,
      errors: [] as string[],
    };

    for (const proposal of proposals || []) {
      try {
        const proposalUrl = `https://classclowncrm.com/proposals/${proposal.id}`;
        const isAgreedStatus = proposal.status === 'agreed';

        // Send Email Reminder
        try {
          const emailHtml = await renderAsync(
            isAgreedStatus 
              ? AgreedReminderEmail({
                  recipientName: proposal.recipient_name,
                  proposalUrl,
                  subject: proposal.subject,
                })
              : ReminderEmail({
                  recipientName: proposal.recipient_name,
                  proposalUrl,
                  subject: proposal.subject,
                  pricePerLesson: proposal.price_per_lesson,
                  paymentCycle: proposal.payment_cycle,
                })
          );

          await resend.emails.send({
            from: 'Journey Beyond Education <enquiries@jb-tutors.com>',
            to: [proposal.recipient_email],
            subject: isAgreedStatus 
              ? '⏰ Complete Your Proposal - Secure Your Spot'
              : '📢 Reminder: Your Lesson Proposal from Journey Beyond',
            html: emailHtml,
          });

          results.emailsSent++;
          console.log(`Email sent to ${proposal.recipient_email}`);
        } catch (emailError: any) {
          console.error(`Email error for proposal ${proposal.id}:`, emailError);
          results.errors.push(`Email failed for ${proposal.recipient_email}: ${emailError.message}`);
        }

        // Send WhatsApp Reminder (if phone number exists)
        if (proposal.recipient_phone) {
          try {
            const whatsappMessage = isAgreedStatus
              ? WhatsAppTemplates.proposalAgreedReminder(
                  proposal.recipient_name,
                  proposal.subject,
                  proposalUrl
                )
              : WhatsAppTemplates.proposalReminder(
                  proposal.recipient_name,
                  proposal.subject,
                  proposal.price_per_lesson,
                  proposal.payment_cycle,
                  proposalUrl
                );

            const whatsappResponse = await fetch('https://graph.facebook.com/v21.0/534496576425584/messages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: proposal.recipient_phone,
                type: 'text',
                text: { body: whatsappMessage }
              }),
            });

            if (!whatsappResponse.ok) {
              throw new Error(`WhatsApp API error: ${whatsappResponse.statusText}`);
            }

            results.whatsappSent++;
            console.log(`WhatsApp sent to ${proposal.recipient_phone}`);
          } catch (whatsappError: any) {
            console.error(`WhatsApp error for proposal ${proposal.id}:`, whatsappError);
            results.errors.push(`WhatsApp failed for ${proposal.recipient_phone}: ${whatsappError.message}`);
          }
        }
      } catch (error: any) {
        console.error(`Error processing proposal ${proposal.id}:`, error);
        results.errors.push(`Proposal ${proposal.id}: ${error.message}`);
      }
    }

    console.log('Daily reminders completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily reminders sent',
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-daily-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
