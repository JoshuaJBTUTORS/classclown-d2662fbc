import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { DailyDemoListEmail } from './_templates/daily-demo-list-email.tsx';

// Timezone utilities
const UK_TIMEZONE = 'Europe/London';

function formatInUKTime(date: Date | string, formatString: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    ...(formatString === 'HH:mm' ? { hour: '2-digit', minute: '2-digit', hour12: false } :
        formatString === 'EEEE, MMMM d, yyyy' ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } :
        { hour: '2-digit', minute: '2-digit', hour12: false })
  }).format(dateObj);
}

function getCurrentUKDate(): string {
  const now = new Date();
  const ukDate = new Date(now.toLocaleString("en-US", { timeZone: UK_TIMEZONE }));
  return ukDate.toISOString().split('T')[0];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoSession {
  lesson_id: string;
  demo_time: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  phone: string;
  subject: string;
  start_time: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

  try {
    const currentDate = getCurrentUKDate();
    console.log(`Processing daily demo list for date: ${currentDate}`);

    // First, get all demo sessions for today
    const { data: demoSessions, error: demoError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        subject
      `)
      .eq('lesson_type', 'demo')
      .gte('start_time', `${currentDate}T00:00:00`)
      .lt('start_time', `${currentDate}T23:59:59`)
      .order('start_time', { ascending: true });

    if (demoError) {
      console.error('Error fetching demo sessions:', demoError);
      throw demoError;
    }

    console.log(`Found ${demoSessions?.length || 0} demo sessions for ${currentDate}`);

    // Now get all trial lessons for today with their bookings
    const { data: trialLessons, error: trialError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        subject,
        trial_bookings (
          child_name,
          parent_name,
          email,
          phone
        )
      `)
      .eq('lesson_type', 'trial')
      .gte('start_time', `${currentDate}T00:00:00`)
      .lt('start_time', `${currentDate}T23:59:59`);

    if (trialError) {
      console.error('Error fetching trial lessons:', trialError);
      throw trialError;
    }

    console.log(`Found ${trialLessons?.length || 0} trial lessons for ${currentDate}`);

    // Match demo sessions with their corresponding trial lessons
    const demos = (demoSessions || []).map(demo => {
      // Find matching trial lesson (same subject, demo before trial, same day)
      const matchingTrial = trialLessons?.find(trial => 
        trial.subject === demo.subject &&
        new Date(trial.start_time) > new Date(demo.start_time) &&
        new Date(trial.start_time).getDate() === new Date(demo.start_time).getDate()
      );

      return {
        ...demo,
        trial_bookings: matchingTrial?.trial_bookings || []
      };
    });



    // Format demo data
    const formattedDemos: DemoSession[] = (demos || []).map(demo => {
      const trialBooking = demo.trial_bookings?.[0];
      const startTime = new Date(demo.start_time);
      const endTime = new Date(demo.end_time);
      
      return {
        lesson_id: demo.id,
        demo_time: `${formatInUKTime(startTime, 'HH:mm')} - ${formatInUKTime(endTime, 'HH:mm')}`,
        child_name: trialBooking?.child_name || 'N/A',
        parent_name: trialBooking?.parent_name || 'N/A',
        parent_email: trialBooking?.email || 'N/A',
        phone: trialBooking?.phone || 'N/A',
        subject: demo.subject || 'N/A',
        start_time: demo.start_time
      };
    });

    // Generate email content
    const formattedDate = formatInUKTime(new Date(), 'EEEE, MMMM d, yyyy');
    const totalDemos = formattedDemos.length;
    
    try {
      const html = await renderAsync(
        React.createElement(DailyDemoListEmail, {
          date: formattedDate,
          totalDemos,
          demos: formattedDemos
        })
      );

      // Send email
      const emailSubject = `Daily Demo List - ${formattedDate} (${totalDemos} demo${totalDemos !== 1 ? 's' : ''} scheduled)`;
      
      const { error: emailError } = await resend.emails.send({
        from: 'JB Tutors Demo List <noreply@jb-tutors.com>',
        to: ['joshua@jb-tutors.com'],
        subject: emailSubject,
        html,
      });

      if (emailError) {
        console.error('Error sending daily demo list email:', emailError);
        throw emailError;
      }

      console.log(`Daily demo list email sent successfully to joshua@jb-tutors.com for ${currentDate}`);
      console.log(`Email contained ${totalDemos} demo sessions`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          date: currentDate,
          totalDemos,
          message: 'Daily demo list email sent successfully'
        }), 
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (emailRenderError) {
      console.error('Error rendering email template:', emailRenderError);
      throw new Error(`Email template rendering failed: ${emailRenderError.message}`);
    }

  } catch (error: any) {
    console.error('Error in send-daily-demo-list function:', error);
    
    // Send error notification email
    try {
      await resend.emails.send({
        from: 'JB Tutors System <noreply@jb-tutors.com>',
        to: ['joshua@jb-tutors.com'],
        subject: 'Daily Demo List - System Error',
        html: `
          <h1>Daily Demo List Error</h1>
          <p>There was an error generating the daily demo list for ${getCurrentUKDate()}.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please check the system logs for more details.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        date: getCurrentUKDate()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);