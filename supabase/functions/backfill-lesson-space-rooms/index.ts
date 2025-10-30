import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility function to add delay between API calls
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("🔍 Starting backfill process for lessons missing LessonSpace rooms...");

    // Find lessons that need LessonSpace rooms created
    // Criteria:
    // 1. lesson_space_room_id IS NULL
    // 2. start_time is in the future
    // 3. status is 'scheduled'
    // 4. has students enrolled
    const { data: lessonsNeedingRooms, error: queryError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        tutor_id,
        is_recurring_instance,
        parent_lesson_id,
        lesson_students(student_id)
      `)
      .is('lesson_space_room_id', null)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (queryError) {
      throw new Error(`Failed to query lessons: ${queryError.message}`);
    }

    // Filter to only include lessons with students
    const lessonsWithStudents = (lessonsNeedingRooms || []).filter(
      lesson => lesson.lesson_students && lesson.lesson_students.length > 0
    );

    console.log(`📊 Found ${lessonsWithStudents.length} lessons needing LessonSpace rooms`);

    if (lessonsWithStudents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No lessons requiring backfill found",
          processed: 0,
          successful: 0,
          failed: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const failedLessonIds: string[] = [];

    // Process each lesson with rate limiting
    for (const lesson of lessonsWithStudents) {
      try {
        console.log(`\n🔄 Processing lesson ${lesson.id} (${lesson.title})`);
        console.log(`   Start time: ${lesson.start_time}`);
        console.log(`   Students: ${lesson.lesson_students.length}`);

        const studentIds = lesson.lesson_students.map(ls => ls.student_id);

        // Call lesson-space-integration to create room
        const { data: roomData, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
          body: {
            action: 'create-room',
            lessonId: lesson.id
          }
        });

        if (roomError) {
          console.error(`   ❌ Failed to create room: ${roomError.message}`);
          failCount++;
          failedLessonIds.push(lesson.id);

          // Update failed_room_creations table
          await supabase.from('failed_room_creations')
            .upsert({
              lesson_id: lesson.id,
              error_message: roomError.message || 'Unknown error',
              error_code: roomError.status || null,
              attempt_count: 1,
              last_attempt_at: new Date().toISOString(),
              resolved: false
            }, {
              onConflict: 'lesson_id'
            });

          continue;
        }

        if (roomData && roomData.success) {
          console.log(`   ✅ Room created successfully`);
          successCount++;

          // Mark as resolved if it was previously failed
          await supabase.from('failed_room_creations')
            .update({ resolved: true })
            .eq('lesson_id', lesson.id);
        } else {
          console.error(`   ❌ Room creation failed: ${roomData?.error || 'Unknown error'}`);
          failCount++;
          failedLessonIds.push(lesson.id);

          // Update failed_room_creations table
          await supabase.from('failed_room_creations')
            .upsert({
              lesson_id: lesson.id,
              error_message: roomData?.error || 'Room creation returned success: false',
              error_code: roomData?.status || null,
              attempt_count: 1,
              last_attempt_at: new Date().toISOString(),
              resolved: false
            }, {
              onConflict: 'lesson_id'
            });
        }
      } catch (error) {
        console.error(`   ❌ Exception processing lesson ${lesson.id}:`, error);
        failCount++;
        failedLessonIds.push(lesson.id);

        // Update failed_room_creations table
        await supabase.from('failed_room_creations')
          .upsert({
            lesson_id: lesson.id,
            error_message: error.message || 'Exception during backfill',
            error_code: null,
            attempt_count: 1,
            last_attempt_at: new Date().toISOString(),
            resolved: false
          }, {
            onConflict: 'lesson_id'
          });
      }

      // Add 250ms delay between requests to respect rate limit (4 req/sec)
      await sleep(250);
    }

    console.log(`\n✅ Backfill process completed`);
    console.log(`   Total processed: ${lessonsWithStudents.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    if (failedLessonIds.length > 0) {
      console.log(`   Failed lesson IDs:`, failedLessonIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill completed. ${successCount} rooms created, ${failCount} failed.`,
        processed: lessonsWithStudents.length,
        successful: successCount,
        failed: failCount,
        failedLessonIds: failedLessonIds
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in backfill function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
