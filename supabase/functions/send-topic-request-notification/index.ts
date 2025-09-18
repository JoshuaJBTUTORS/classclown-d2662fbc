import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { TopicRequestApprovalEmail } from "./_templates/topic-request-approval-email.tsx";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopicRequestNotificationRequest {
  requestId: string;
  status: 'approved' | 'denied';
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, status, adminNotes }: TopicRequestNotificationRequest = await req.json();

    console.log('Processing topic request notification:', { requestId, status });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Import supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch topic request details with related data
    const { data: topicRequest, error: fetchError } = await supabase
      .from('topic_requests')
      .select(`
        *,
        lessons!inner(
          title,
          start_time,
          subject
        ),
        students!inner(
          first_name,
          last_name,
          email
        ),
        parents(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !topicRequest) {
      console.error('Error fetching topic request:', fetchError);
      throw new Error('Topic request not found');
    }

    console.log('Topic request data:', topicRequest);

    // Determine recipient email
    let recipientEmail = '';
    let recipientName = '';

    if (topicRequest.parents?.email) {
      // Parent made the request
      recipientEmail = topicRequest.parents.email;
      recipientName = `${topicRequest.parents.first_name} ${topicRequest.parents.last_name}`;
    } else if (topicRequest.students?.email) {
      // Student made the request
      recipientEmail = topicRequest.students.email;
      recipientName = `${topicRequest.students.first_name} ${topicRequest.students.last_name}`;
    }

    if (!recipientEmail) {
      console.error('No recipient email found for topic request:', requestId);
      throw new Error('No recipient email found');
    }

    // Only send email for approved requests
    if (status !== 'approved') {
      console.log('Not sending email for non-approved request');
      return new Response(JSON.stringify({ success: true, message: 'No email sent for non-approved request' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Format lesson date and time
    const lessonDate = new Date(topicRequest.lessons.start_time).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const lessonTime = new Date(topicRequest.lessons.start_time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(TopicRequestApprovalEmail, {
        recipientName,
        studentName: `${topicRequest.students.first_name} ${topicRequest.students.last_name}`,
        lessonTitle: topicRequest.lessons.title,
        lessonSubject: topicRequest.lessons.subject || '',
        lessonDate,
        lessonTime,
        requestedTopic: topicRequest.requested_topic,
        adminNotes: adminNotes || ''
      })
    );

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'JB Tutors <noreply@jb-tutors.com>',
      to: [recipientEmail],
      subject: `Topic Request Approved - ${topicRequest.lessons.title}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-topic-request-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);