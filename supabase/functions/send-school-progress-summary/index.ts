import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { SchoolProgressSummaryEmail } from './_templates/school-progress-summary-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolProgressSummaryRequest {
  cycleId?: string;
  testMode?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('School progress summary function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cycleId, testMode = false }: SchoolProgressSummaryRequest = await req.json();
    
    // Get current or specified cycle
    let targetCycle;
    if (cycleId) {
      const { data: cycle } = await supabase
        .from('school_progress_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();
      targetCycle = cycle;
    } else {
      const { data: cycle } = await supabase
        .from('school_progress_cycles')
        .select('*')
        .eq('is_active', true)
        .gte('cycle_end_date', new Date().toISOString().split('T')[0])
        .order('cycle_start_date', { ascending: true })
        .limit(1)
        .single();
      targetCycle = cycle;
    }

    if (!targetCycle) {
      return new Response(
        JSON.stringify({ error: 'No reporting cycle found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Target cycle:', targetCycle);

    // Get all active parents with students
    const { data: allParents, error: parentsError } = await supabase
      .from('parents')
      .select(`
        id,
        first_name,
        last_name,
        email,
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

    // Get school progress submissions for this cycle
    const { data: submissions, error: submissionsError } = await supabase
      .from('school_progress')
      .select(`
        id,
        student_id,
        uploaded_by,
        upload_date,
        file_name,
        students!inner(
          id,
          first_name,
          last_name,
          parent_id,
          parents!inner(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .gte('upload_date', targetCycle.cycle_start_date)
      .lte('upload_date', targetCycle.cycle_end_date);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      throw submissionsError;
    }

    console.log(`Found ${submissions?.length || 0} submissions for cycle`);

    // Process submission data
    const submissionsByParent = new Map();
    
    submissions?.forEach(submission => {
      const parent = submission.students.parents;
      const student = submission.students;
      
      if (!parent) return;
      
      const parentKey = parent.id;
      if (!submissionsByParent.has(parentKey)) {
        submissionsByParent.set(parentKey, {
          parentName: `${parent.first_name} ${parent.last_name}`,
          studentNames: [],
          reportsCount: 0,
          submissionDate: submission.upload_date,
        });
      }
      
      const parentData = submissionsByParent.get(parentKey);
      const studentName = `${student.first_name} ${student.last_name}`;
      
      if (!parentData.studentNames.includes(studentName)) {
        parentData.studentNames.push(studentName);
      }
      
      parentData.reportsCount++;
      
      // Keep the most recent submission date
      if (new Date(submission.upload_date) > new Date(parentData.submissionDate)) {
        parentData.submissionDate = submission.upload_date;
      }
    });

    // Identify parents who haven't submitted
    const parentsWithSubmissions = new Set([...submissionsByParent.keys()]);
    const pendingParents = allParents
      ?.filter(parent => !parentsWithSubmissions.has(parent.id))
      .map(parent => ({
        parentName: `${parent.first_name} ${parent.last_name}`,
        studentNames: parent.students.map((s: any) => `${s.first_name} ${s.last_name}`),
      })) || [];

    // Calculate statistics
    const totalParents = allParents?.length || 0;
    const totalReportsSubmitted = submissions?.length || 0;
    const parentsWithSubmissionsCount = submissionsByParent.size;
    const submissionRate = totalParents > 0 ? Math.round((parentsWithSubmissionsCount / totalParents) * 100) : 0;

    // Format dates
    const cycleStartDate = new Date(targetCycle.cycle_start_date).toLocaleDateString('en-GB');
    const cycleEndDate = new Date(targetCycle.cycle_end_date).toLocaleDateString('en-GB');

    // Prepare parent submissions array
    const parentSubmissions = Array.from(submissionsByParent.values()).map(data => ({
      ...data,
      submissionDate: new Date(data.submissionDate).toLocaleDateString('en-GB'),
    }));

    // Generate email HTML
    const emailHtml = await renderAsync(
      React.createElement(SchoolProgressSummaryEmail, {
        cycleStartDate,
        cycleEndDate,
        totalParents,
        totalReportsSubmitted,
        submissionRate,
        parentSubmissions,
        pendingParents,
      })
    );

    // Send summary email to admin emails
    const adminEmails = ['britney@jb-tutors.com', 'joshua@jb-tutors.com'];
    
    let emailsSent = 0;
    const errors: string[] = [];

    for (const adminEmail of adminEmails) {
      try {
        const emailResponse = await resend.emails.send({
          from: 'JB Tutors <notifications@jb-tutors.com>',
          to: [adminEmail],
          subject: `School Progress Report Summary - ${cycleStartDate} to ${cycleEndDate}`,
          html: emailHtml,
        });

        if (emailResponse.error) {
          errors.push(`Failed to send to ${adminEmail}: ${emailResponse.error.message}`);
        } else {
          emailsSent++;
          console.log('Summary email sent to:', adminEmail);
        }
      } catch (error) {
        console.error('Error sending to:', adminEmail, error);
        errors.push(`Error sending to ${adminEmail}: ${error.message}`);
      }
    }

    // Record summary notification in database
    await supabase
      .from('school_progress_notifications')
      .insert({
        cycle_id: targetCycle.id,
        parent_id: null, // This is an admin summary, not parent-specific
        notification_type: 'summary',
        email_status: emailsSent > 0 ? 'sent' : 'failed',
        error_message: errors.length > 0 ? errors.join('; ') : null,
      });

    const result = {
      cycle: targetCycle,
      statistics: {
        totalParents,
        totalReportsSubmitted,
        parentsWithSubmissions: parentsWithSubmissionsCount,
        submissionRate,
      },
      emailsSent,
      adminEmails,
      errors: errors.length > 0 ? errors : undefined,
      testMode,
    };

    console.log('School progress summary completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-school-progress-summary function:', error);
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
