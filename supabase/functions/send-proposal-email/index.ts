import React from 'npm:react@18.3.1';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ProposalEmail } from './_templates/proposal-email.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface EmailRequest {
  proposalId: string;
  recipientEmail: string;
  recipientName: string;
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

    const { proposalId, recipientEmail, recipientName }: EmailRequest = await req.json();

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
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'http://localhost:5173';
    const proposalUrl = `${baseUrl}/proposal/${proposal.id}/${proposal.access_token}`;

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
      from: 'Journey Beyond Education <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: 'Your Lesson Proposal from Journey Beyond Education',
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully to:', recipientEmail);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
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
