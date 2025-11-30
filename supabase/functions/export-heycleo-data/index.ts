import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin/owner access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or owner
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdminOrOwner = userRoles?.some(r => r.role === 'admin' || r.role === 'owner');
    if (!isAdminOrOwner) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin or Owner role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Data export initiated by user: ${user.email}`);

    // Define all tables to export in dependency order
    const tables = [
      // Core User Tables
      'profiles',
      'user_roles',
      
      // Subjects & Curriculum (needed before courses)
      'subjects',
      'year_groups',
      'curriculum_year_groups',
      
      // Exam Board Tables
      'exam_board_specifications',
      
      // Course Content Tables
      'courses',
      'course_exam_board_specifications',
      'course_modules',
      'course_lessons',
      'course_notes',
      'course_purchases',
      
      // Cleo Conversation Tables
      'cleo_conversations',
      'cleo_messages',
      'cleo_learning_progress',
      'cleo_lesson_plans',
      'cleo_lesson_state',
      'cleo_question_answers',
      
      // Gamification Tables
      'user_gamification_stats',
      'user_badges',
      
      // Voice Quota & Subscription Tables
      'voice_session_quotas',
      'platform_subscriptions',
      'platform_subscription_plans',
      
      // Assessment Tables
      'ai_assessments',
      'assessment_questions',
      'assessment_sessions',
      'student_responses',
      'assessment_improvements',
      
      // System Tables
      'app_settings',
    ];

    const exportData: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      sourceProject: Deno.env.get('SUPABASE_URL'),
      exportedBy: user.email,
      tables: {},
      counts: {},
      errors: [],
    };

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*');
        
        if (error) {
          console.log(`Warning: Could not export ${table}: ${error.message}`);
          exportData.tables[table] = [];
          exportData.counts[table] = 0;
          exportData.errors.push({ table, error: error.message });
        } else {
          exportData.tables[table] = data || [];
          exportData.counts[table] = data?.length || 0;
          console.log(`Exported ${table}: ${data?.length || 0} rows`);
        }
      } catch (err) {
        console.log(`Error exporting ${table}: ${err.message}`);
        exportData.tables[table] = [];
        exportData.counts[table] = 0;
        exportData.errors.push({ table, error: err.message });
      }
    }

    // Calculate totals
    const totalRows = Object.values(exportData.counts).reduce((a: number, b: any) => a + b, 0);
    exportData.totalRows = totalRows;
    exportData.totalTables = tables.length;

    console.log(`Export complete: ${totalRows} total rows from ${tables.length} tables`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="heycleo-data-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
