import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import { TopicRequestNotificationEmail } from './_templates/topic-request-notification-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopicRequestNotificationRequest {
  requestId: string;
  status: 'approved' | 'denied';
  adminNotes?: string;
  requestedTopic?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Topic request notification function called');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requestId, status, adminNotes, requestedTopic }: TopicRequestNotificationRequest = await req.json();
    console.log('Processing notification for request:', requestId, 'with status:', status);

    // Fetch the topic request with student and parent details
    const { data: topicRequest, error: requestError } = await supabase
      .from('topic_requests')
      .select(`
        *,
        students!inner (
          first_name,
          last_name,
          email,
          parents (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching topic request:', requestError);
      throw requestError;
    }

    if (!topicRequest) {
      throw new Error('Topic request not found');
    }

    console.log('Found topic request:', topicRequest);

    const student = topicRequest.students;
    const parent = student.parents;

    // Prepare email recipients
    const recipients: string[] = [];
    
    // Always notify the student if they have an email
    if (student.email) {
      recipients.push(student.email);
    }
    
    // Notify parent if they exist and have an email
    if (parent?.email) {
      recipients.push(parent.email);
    }

    if (recipients.length === 0) {
      console.log('No email recipients found for topic request:', requestId);
      return new Response(
        JSON.stringify({ message: 'No email recipients found' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(TopicRequestNotificationEmail, {
        studentName: `${student.first_name} ${student.last_name}`,
        parentName: parent ? `${parent.first_name} ${parent.last_name}` : null,
        requestedTopic: topicRequest.requested_topic,
        status: status,
        adminNotes: adminNotes,
        submittedDate: new Date(topicRequest.created_at).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })
    );

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: 'Class Beyond <notifications@classbeyondacademy.io>',
      to: recipients,
      subject: `Topic Request ${status === 'approved' ? 'Approved' : 'Update'} - General Request`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        message: 'Notification sent successfully',
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in topic request notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send topic request notification'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);