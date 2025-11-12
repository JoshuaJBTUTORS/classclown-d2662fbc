import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting backfill process for missing participant URLs...');

    // Find lessons with rooms but missing participant URLs
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        lesson_space_room_id,
        lesson_space_space_id,
        start_time,
        lesson_students (
          student_id,
          students (
            id,
            first_name,
            last_name
          )
        )
      `)
      .not('lesson_space_room_id', 'is', null)
      .not('lesson_space_space_id', 'is', null)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString());

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`📊 Found ${lessons?.length || 0} lessons with rooms to check`);

    const lessonsNeedingBackfill = [];

    // Check each lesson for missing URLs
    for (const lesson of lessons || []) {
      const enrolledStudents = lesson.lesson_students || [];
      
      if (enrolledStudents.length === 0) {
        continue;
      }

      // Count existing participant URLs for this lesson
      const { count: urlCount, error: countError } = await supabase
        .from('lesson_participant_urls')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lesson.id);

      if (countError) {
        console.error(`Error counting URLs for lesson ${lesson.id}:`, countError);
        continue;
      }

      // If number of URLs is less than enrolled students, we need to backfill
      if ((urlCount || 0) < enrolledStudents.length) {
        lessonsNeedingBackfill.push({
          ...lesson,
          enrolledCount: enrolledStudents.length,
          urlCount: urlCount || 0,
          missingCount: enrolledStudents.length - (urlCount || 0)
        });
      }
    }

    console.log(`🎯 Found ${lessonsNeedingBackfill.length} lessons needing participant URL backfill`);

    const results = {
      total: lessonsNeedingBackfill.length,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each lesson
    for (const lesson of lessonsNeedingBackfill) {
      console.log(`📝 Processing lesson: ${lesson.title} (ID: ${lesson.id})`);
      console.log(`   - Enrolled students: ${lesson.enrolledCount}`);
      console.log(`   - Existing URLs: ${lesson.urlCount}`);
      console.log(`   - Missing URLs: ${lesson.missingCount}`);

      try {
        // Get all student IDs for this lesson
        const studentIds = lesson.lesson_students
          .map((ls: any) => ls.student_id)
          .filter((id: number) => id != null);

        // Call lesson-space-integration to add students to room
        const { data: integrationResult, error: integrationError } = await supabase.functions.invoke(
          'lesson-space-integration',
          {
            body: {
              action: 'add-students-to-room',
              lessonId: lesson.id,
              roomId: lesson.lesson_space_room_id,
              spaceId: lesson.lesson_space_space_id,
              studentIds: studentIds
            }
          }
        );

        if (integrationError) {
          console.error(`❌ Failed to backfill URLs for lesson ${lesson.id}:`, integrationError);
          results.failed++;
          results.errors.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            error: integrationError.message
          });
        } else if (!integrationResult?.success) {
          console.error(`❌ Integration returned failure for lesson ${lesson.id}:`, integrationResult?.error);
          results.failed++;
          results.errors.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            error: integrationResult?.error || 'Unknown error'
          });
        } else {
          console.log(`✅ Successfully backfilled URLs for lesson ${lesson.id}`);
          results.successful++;
        }
      } catch (error) {
        console.error(`❌ Exception processing lesson ${lesson.id}:`, error);
        results.failed++;
        results.errors.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          error: error.message
        });
      }
    }

    console.log('✨ Backfill process complete');
    console.log(`   - Total processed: ${results.total}`);
    console.log(`   - Successful: ${results.successful}`);
    console.log(`   - Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill complete: ${results.successful} successful, ${results.failed} failed`,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in backfill-participant-urls function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
