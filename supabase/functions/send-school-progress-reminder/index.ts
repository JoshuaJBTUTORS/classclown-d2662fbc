import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { SchoolProgressReminderEmail } from './_templates/school-progress-reminder-email.tsx';
import { whatsappService } from '../_shared/whatsapp-service.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolProgressReminderRequest {
  cycleId?: string;
  testMode?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('School progress reminder function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cycleId, testMode = false }: SchoolProgressReminderRequest = await req.json();
    
    // Get current cycle if not specified
    let currentCycle;
    if (cycleId) {
      const { data: cycle } = await supabase
        .from('school_progress_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();
      currentCycle = cycle;
    } else {
      const { data: cycle } = await supabase
        .from('school_progress_cycles')
        .select('*')
        .eq('is_active', true)
        .gte('cycle_end_date', new Date().toISOString().split('T')[0])
        .order('cycle_start_date', { ascending: true })
        .limit(1)
        .single();
      currentCycle = cycle;
    }

    if (!currentCycle) {
      return new Response(
        JSON.stringify({ error: 'No active reporting cycle found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current cycle:', currentCycle);

    // Get all active parents with their students
    const { data: parentsWithStudents, error: parentsError } = await supabase
      .from('parents')
      .select(`
        id,
        first_name,
        last_name,
        email,
        whatsapp_number,
        whatsapp_enabled,
        students!inner(
          id,
          first_name,
          last_name,
          status
        )
      `)
      .eq('students.status', 'active');

    if (parentsError) {
      console.error('Error fetching parents:', parentsError);
      throw parentsError;
    }

    console.log(`Found ${parentsWithStudents?.length || 0} active parents`);

    let emailsSent = 0;
    let whatsappSent = 0;
    const errors: string[] = [];

    for (const parent of parentsWithStudents || []) {
      try {
        // Check if parent has already been notified in this cycle
        const { data: existingNotification } = await supabase
          .from('school_progress_notifications')
          .select('id')
          .eq('parent_id', parent.id)
          .eq('cycle_id', currentCycle.id)
          .eq('notification_type', 'reminder')
          .eq('email_status', 'sent')
          .single();

        if (existingNotification && !testMode) {
          console.log(`Parent ${parent.email} already notified in this cycle`);
          continue;
        }

        const parentName = `${parent.first_name} ${parent.last_name}`;
        const studentNames = parent.students.map((s: any) => `${s.first_name} ${s.last_name}`);
        const cycleEndDate = new Date(currentCycle.cycle_end_date).toLocaleDateString('en-GB');
        const submissionUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://sjxbxkpegcnnfjbsxazo.supabase.co')}/school-progress`;

        // Generate email HTML
        const emailHtml = await renderAsync(
          React.createElement(SchoolProgressReminderEmail, {
            parentName,
            studentNames,
            cycleEndDate,
            submissionUrl,
          })
        );

        // Send email
        const emailResponse = await resend.emails.send({
          from: 'JB Tutors <notifications@jb-tutors.com>',
          to: [parent.email],
          subject: `School Progress Report Reminder - Due ${cycleEndDate}`,
          html: emailHtml,
        });

        console.log('Email sent to:', parent.email, emailResponse);

        // Record notification in database
        const notificationStatus = emailResponse.error ? 'failed' : 'sent';
        await supabase
          .from('school_progress_notifications')
          .insert({
            cycle_id: currentCycle.id,
            parent_id: parent.id,
            notification_type: 'reminder',
            email_status: notificationStatus,
            error_message: emailResponse.error?.message || null,
          });

        if (!emailResponse.error) {
          emailsSent++;

          // Send WhatsApp message if enabled and number available
          if (parent.whatsapp_enabled && parent.whatsapp_number) {
            try {
              const whatsappMessage = `Hi ${parentName}! 📚

This is a friendly reminder that our 6-week school progress reporting cycle ends on ${cycleEndDate}.

Please submit the latest school reports for ${studentNames.join(' and ')} when convenient.

Benefits of submitting reports:
• Tailored lesson plans for your child
• Focused discussion on strengths & areas for improvement  
• Targeted support from tutors

Submit here: ${submissionUrl}

Thanks! - JB Tutors Team`;

              await whatsappService.sendMessage(parent.whatsapp_number, whatsappMessage);
              whatsappSent++;
              console.log('WhatsApp sent to:', parent.whatsapp_number);
            } catch (whatsappError) {
              console.error('WhatsApp error for parent:', parent.email, whatsappError);
              errors.push(`WhatsApp failed for ${parent.email}: ${whatsappError.message}`);
            }
          }
        } else {
          errors.push(`Email failed for ${parent.email}: ${emailResponse.error.message}`);
        }

      } catch (error) {
        console.error('Error processing parent:', parent.email, error);
        errors.push(`Failed to process ${parent.email}: ${error.message}`);
        
        // Record failed notification
        await supabase
          .from('school_progress_notifications')
          .insert({
            cycle_id: currentCycle.id,
            parent_id: parent.id,
            notification_type: 'reminder',
            email_status: 'failed',
            error_message: error.message,
          });
      }
    }

    const result = {
      cycle: currentCycle,
      emailsSent,
      whatsappSent,
      totalParents: parentsWithStudents?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      testMode,
    };

    console.log('School progress reminder completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-school-progress-reminder function:', error);
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