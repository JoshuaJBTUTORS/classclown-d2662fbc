import React from 'npm:react@18.3.1';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ProposalEmail } from './_templates/proposal-email.tsx';
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface EmailRequest {
  proposalId: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const { proposalId, recipientEmail, recipientName, recipientPhone }: EmailRequest = await req.json();

    console.log('Sending proposal email for:', proposalId);

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('lesson_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposal not found');
    }

    // Generate proposal URL
    const proposalUrl = `https://classclowncrm.com/proposal/${proposal.id}/${proposal.access_token}`;

    // Render email HTML
    const html = await renderAsync(
      React.createElement(ProposalEmail, {
        recipientName,
        proposalUrl,
        subject: proposal.subject,
        pricePerLesson: Number(proposal.price_per_lesson),
        paymentCycle: proposal.payment_cycle,
      })
    );

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Journey Beyond Education <enquiries@jb-tutors.com>',
      to: [recipientEmail],
      subject: 'Your Lesson Proposal from Journey Beyond Education',
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully to:', recipientEmail);

    // Send WhatsApp message if phone number is available
    let whatsappSuccess = false;
    if (recipientPhone) {
      console.log('Sending WhatsApp notification to:', recipientPhone);
      
      const whatsappText = WhatsAppTemplates.proposalNotification(
        recipientName,
        proposal.subject,
        Number(proposal.price_per_lesson),
        proposal.payment_cycle,
        proposalUrl
      );

      const whatsappNumber = whatsappService.formatPhoneNumber(recipientPhone);
      const whatsappResponse = await whatsappService.sendMessage({
        phoneNumber: whatsappNumber,
        text: whatsappText
      });

      if (whatsappResponse.success) {
        console.log('WhatsApp message sent successfully:', whatsappResponse.messageId);
        whatsappSuccess = true;
      } else {
        console.error('WhatsApp message failed:', whatsappResponse.error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications sent successfully',
        emailSent: true,
        whatsappSent: whatsappSuccess
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-proposal-email:', error);
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
