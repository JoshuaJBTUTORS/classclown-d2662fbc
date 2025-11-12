import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getCurrentUKDate(): string {
  const now = new Date();
  const ukDate = new Date(now.toLocaleString("en-US", { timeZone: 'Europe/London' }));
  return ukDate.toISOString().split('T')[0];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const currentDate = getCurrentUKDate();
    console.log(`Testing demo data fetch for date: ${currentDate}`);

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

    console.log(`Found ${demoSessions?.length || 0} demo sessions`);

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

    console.log(`Found ${trialLessons?.length || 0} trial lessons`);

    // Match demo sessions with their corresponding trial lessons
    const demos = (demoSessions || []).map(demo => {
      const matchingTrial = trialLessons?.find(trial => 
        trial.subject === demo.subject &&
        new Date(trial.start_time) > new Date(demo.start_time) &&
        new Date(trial.start_time).getDate() === new Date(demo.start_time).getDate()
      );

      return {
        ...demo,
        trial_bookings: matchingTrial?.trial_bookings || [],
        matching_trial_id: matchingTrial?.id || null
      };
    });

    console.log(`Matched ${demos.length} demo sessions with trial data`);

    return new Response(
      JSON.stringify({ 
        success: true,
        date: currentDate,
        demo_sessions: demoSessions?.length || 0,
        trial_lessons: trialLessons?.length || 0,
        matched_demos: demos.length,
        demos: demos,
        message: 'Demo data fetching test completed successfully'
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in test-demo-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
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