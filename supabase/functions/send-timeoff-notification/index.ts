import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { TimeOffNotificationEmail } from './_templates/timeoff-notification-email.tsx';
import { whatsappService, WhatsAppTemplates } from '../_shared/whatsapp-service.ts';
import { formatInUKTime } from '../_shared/timezone-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();
    const timeOffRequestId = record.id;

    console.log(`Processing time-off notification for request ${timeOffRequestId}`);

    // Get the time-off request with tutor details
    const { data: timeOffData, error: timeOffError } = await supabase
      .from('time_off_requests')
      .select(`
        *,
        tutor:tutors(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', timeOffRequestId)
      .single();

    if (timeOffError || !timeOffData) {
      console.error('Error fetching time-off request:', timeOffError);
      return new Response(JSON.stringify({ error: 'Time-off request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tutorName = `${timeOffData.tutor.first_name} ${timeOffData.tutor.last_name}`;
    const startDate = formatInUKTime(timeOffData.start_date, 'EEEE, MMMM do, yyyy');
    const endDate = formatInUKTime(timeOffData.end_date, 'EEEE, MMMM do, yyyy');
    const startTime = timeOffData.start_time ? formatInUKTime(`${timeOffData.start_date}T${timeOffData.start_time}`, 'h:mm a') : null;
    const endTime = timeOffData.end_time ? formatInUKTime(`${timeOffData.end_date}T${timeOffData.end_time}`, 'h:mm a') : null;

    // Admin details
    const adminEmail = "britney@jb-tutors.com";
    const adminWhatsApp = "+44 7956363448";

    // Send email notification
    const emailHtml = await renderAsync(
      React.createElement(TimeOffNotificationEmail, {
        tutorName,
        reason: timeOffData.reason || 'No reason provided',
        startDate,
        endDate,
        startTime,
        endTime,
        status: timeOffData.status,
        timeOffRequestId,
        supabaseUrl: Deno.env.get('SUPABASE_URL') ?? ''
      })
    );

    const { error: emailError } = await resend.emails.send({
      from: 'JB Tutors <notifications@jb-tutors.com>',
      to: [adminEmail],
      subject: `New Time-Off Request from ${tutorName}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
    } else {
      console.log(`Email notification sent to ${adminEmail}`);
    }

    // Send WhatsApp notification
    const whatsappMessage = WhatsAppTemplates.timeOffNotification({
      tutorName,
      reason: timeOffData.reason || 'No reason provided',
      startDate,
      endDate,
      startTime,
      endTime,
      status: timeOffData.status
    });

    const whatsappResult = await whatsappService.sendMessage({
      phoneNumber: adminWhatsApp,
      text: whatsappMessage
    });

    if (!whatsappResult.success) {
      console.error('Error sending WhatsApp:', whatsappResult.error);
    } else {
      console.log(`WhatsApp notification sent to ${adminWhatsApp}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: !emailError,
      whatsappSent: whatsappResult.success 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-timeoff-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});