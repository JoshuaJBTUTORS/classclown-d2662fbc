import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to ensure we have a proper array
function ensureArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
}

// Helper function to chunk arrays for safe deletion
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Safe deletion function that handles arrays properly
async function safeDelete(
  supabaseClient: any,
  tableName: string,
  filterColumn: string,
  ids: any[],
  description: string
) {
  const safeIds = ensureArray(ids).filter(id => id != null);
  
  if (safeIds.length === 0) {
    console.log(`ℹ️ No ${description} to delete`);
    return { success: true, deleted: 0 };
  }

  console.log(`🗑️ Deleting ${safeIds.length} ${description}...`);
  
  try {
    // Process in chunks to avoid overwhelming the query
    const chunks = chunkArray(safeIds, 100);
    let totalDeleted = 0;
    
    for (const chunk of chunks) {
      const { data, error } = await supabaseClient
        .from(tableName)
        .delete()
        .in(filterColumn, chunk)
        .select('id');
        
      if (error) {
        console.error(`Error deleting ${description} chunk:`, error);
        return { success: false, error };
      }
      
      totalDeleted += ensureArray(data).length;
    }
    
    console.log(`✅ Deleted ${totalDeleted} ${description}`);
    return { success: true, deleted: totalDeleted };
  } catch (err) {
    console.error(`Exception deleting ${description}:`, err);
    return { success: false, error: err };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🧹 Starting hardened demo data cleanup...');

    // Step 1: Fetch all demo entity IDs safely
    console.log('🔎 Fetching demo entity IDs...');
    
    const { data: lessonRows, error: lessonError } = await supabaseClient
      .from('lessons')
      .select('id')
      .eq('is_demo_data', true);
      
    const { data: homeworkRows, error: homeworkError } = await supabaseClient
      .from('homework')
      .select('id')
      .eq('is_demo_data', true);

    if (lessonError) {
      console.error('Error fetching demo lessons:', lessonError);
    }
    if (homeworkError) {
      console.error('Error fetching demo homework:', homeworkError);
    }

    const lessonIds = ensureArray(lessonRows).map((r: any) => r.id).filter(id => id != null);
    const homeworkIds = ensureArray(homeworkRows).map((r: any) => r.id).filter(id => id != null);
    
    console.log(`📊 Found ${lessonIds.length} demo lessons, ${homeworkIds.length} demo homework`);

    // Step 2: Delete homework submissions first
    if (homeworkIds.length > 0) {
      await safeDelete(supabaseClient, 'homework_submissions', 'homework_id', homeworkIds, 'homework submissions');
    }

    // Step 3: Delete lesson child records
    if (lessonIds.length > 0) {
      const childTables = [
        { table: 'lesson_transcriptions', column: 'lesson_id', desc: 'lesson transcriptions' },
        { table: 'lesson_student_summaries', column: 'lesson_id', desc: 'lesson summaries' },
        { table: 'lesson_participant_urls', column: 'lesson_id', desc: 'participant URLs' },
        { table: 'lesson_plan_assignments', column: 'lesson_id', desc: 'lesson plan assignments' },
        { table: 'lesson_attendance', column: 'lesson_id', desc: 'lesson attendance' },
        { table: 'lesson_students', column: 'lesson_id', desc: 'lesson students' },
        { table: 'demo_sessions', column: 'lesson_id', desc: 'demo sessions' }
      ];

      for (const { table, column, desc } of childTables) {
        await safeDelete(supabaseClient, table, column, lessonIds, desc);
      }
    }

    // Step 4: Delete main entities
    const mainDeletions = [
      { table: 'homework', filter: 'is_demo_data', desc: 'demo homework' },
      { table: 'lessons', filter: 'is_demo_data', desc: 'demo lessons' },
      { table: 'students', filter: 'is_demo_data', desc: 'demo students' },
      { table: 'parents', filter: 'is_demo_data', desc: 'demo parents' },
      { table: 'tutors', filter: 'is_demo_data', desc: 'demo tutors' },
      { table: 'courses', filter: 'is_demo_data', desc: 'demo courses' }
    ];

    const deletionResults: any = {};
    
    for (const { table, filter, desc } of mainDeletions) {
      try {
        console.log(`🗑️ Deleting ${desc}...`);
        const { data, error } = await supabaseClient
          .from(table)
          .delete()
          .eq(filter, true)
          .select('id');
          
        if (error) {
          console.error(`Error deleting ${desc}:`, error);
          deletionResults[table] = 0;
        } else {
          const deletedCount = ensureArray(data).length;
          console.log(`✅ Deleted ${deletedCount} ${desc}`);
          deletionResults[table] = deletedCount;
        }
      } catch (err) {
        console.error(`Exception deleting ${desc}:`, err);
        deletionResults[table] = 0;
      }
    }

    // Step 5: Set demo cleanup flag
    console.log('🚩 Setting demo cleanup flag...');
    const { error: flagError } = await supabaseClient
      .from('notifications')
      .insert({
        type: 'demo_cleanup_completed',
        subject: 'Demo Data Cleanup Completed',
        email: 'system@cleanup.com',
        status: 'completed'
      });

    if (flagError) {
      console.error('Error setting cleanup flag:', flagError);
    }

    console.log('✅ Demo data cleanup completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo data cleanup completed successfully',
        deleted: deletionResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error during demo data cleanup:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})