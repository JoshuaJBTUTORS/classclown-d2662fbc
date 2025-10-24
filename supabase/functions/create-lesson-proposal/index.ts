import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalRequest {
  recipientEmail: string;
  recipientName: string;
  studentId?: number;
  parentId?: string;
  lessonType: string;
  subject: string;
  pricePerLesson: number;
  paymentCycle: string;
  lessonTimes: Array<{
    day: string;
    time: string;
    duration: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and has owner role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'owner' && userRole.role !== 'admin')) {
      throw new Error('Unauthorized: Only owners and admins can create proposals');
    }

    // Parse request body
    const proposalData: ProposalRequest = await req.json();

    // Generate unique access token
    const accessToken = crypto.randomUUID();

    // Create proposal in database
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('lesson_proposals')
      .insert({
        student_id: proposalData.studentId,
        parent_id: proposalData.parentId,
        created_by: user.id,
        recipient_email: proposalData.recipientEmail,
        recipient_name: proposalData.recipientName,
        lesson_type: proposalData.lessonType,
        subject: proposalData.subject,
        price_per_lesson: proposalData.pricePerLesson,
        payment_cycle: proposalData.paymentCycle,
        lesson_times: proposalData.lessonTimes,
        access_token: accessToken,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (proposalError) {
      console.error('Error creating proposal:', proposalError);
      throw proposalError;
    }

    console.log('Proposal created:', proposal.id);

    // Send email notification via send-proposal-email edge function
    const emailResponse = await supabaseClient.functions.invoke('send-proposal-email', {
      body: {
        proposalId: proposal.id,
        recipientEmail: proposalData.recipientEmail,
        recipientName: proposalData.recipientName,
      },
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      // Don't fail the whole request if email fails
    }

    // Generate shareable URL
    const proposalUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/proposal/${proposal.id}/${accessToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        proposalId: proposal.id,
        proposalUrl,
        message: 'Proposal created and sent successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-lesson-proposal:', error);
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
