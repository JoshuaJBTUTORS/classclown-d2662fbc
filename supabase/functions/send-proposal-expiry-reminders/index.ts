import React from 'npm:react@18.3.1';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ProposalExpiryReminderEmail } from './_templates/proposal-expiry-reminder-email.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const WINDOW_MS = 24 * 60 * 60 * 1000;

function formatTimeLeft(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const now = Date.now();

    const { data: proposals, error } = await supabase
      .from('lesson_proposals')
      .select('id, access_token, recipient_email, recipient_name, created_at, status, reminder_12h_sent_at, reminder_1h_sent_at')
      .in('status', ['sent', 'viewed'])
      .gte('created_at', new Date(now - WINDOW_MS).toISOString());

    if (error) throw error;

    let sent = 0;
    const failures: string[] = [];

    for (const p of proposals ?? []) {
      const remaining = new Date(p.created_at).getTime() + WINDOW_MS - now;
      if (remaining <= 0) continue;

      let column: 'reminder_1h_sent_at' | 'reminder_12h_sent_at' | null = null;
      if (remaining <= 60 * 60 * 1000 && !p.reminder_1h_sent_at) column = 'reminder_1h_sent_at';
      else if (remaining <= 12 * 60 * 60 * 1000 && !p.reminder_12h_sent_at) column = 'reminder_12h_sent_at';
      if (!column || !p.recipient_email) continue;

      const timeLeftLabel = formatTimeLeft(remaining);
      const proposalUrl = `https://classclowncrm.com/proposal/${p.id}/${p.access_token}`;

      try {
        const html = await renderAsync(
          React.createElement(ProposalExpiryReminderEmail, {
            recipientName: p.recipient_name || 'there',
            proposalUrl,
            timeLeftLabel,
          })
        );

        const { error: emailError } = await resend.emails.send({
          from: 'Class Beyond <enquiries@classbeyondacademy.io>',
          to: [p.recipient_email],
          subject: `Your proposal discount expires in ${timeLeftLabel}`,
          html,
        });

        if (emailError) throw emailError;

        await supabase
          .from('lesson_proposals')
          .update({ [column]: new Date().toISOString() })
          .eq('id', p.id);

        sent++;
      } catch (e: any) {
        console.error(`Reminder failed for proposal ${p.id}:`, e?.message ?? e);
        failures.push(p.id);
      }
    }

    console.log(`Proposal expiry reminders sent: ${sent}, failures: ${failures.length}`);

    return new Response(JSON.stringify({ success: true, sent, failures }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-proposal-expiry-reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
