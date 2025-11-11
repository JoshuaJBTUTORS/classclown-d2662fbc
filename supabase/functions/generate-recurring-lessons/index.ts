
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility function to add delay between API calls to respect rate limits
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

    console.log("Starting recurring lesson generation...");

    // Find recurring lesson groups that need new instances
    const { data: recurringGroups, error: groupsError } = await supabase
      .from('recurring_lesson_groups')
      .select(`
        *,
        original_lesson:lessons!original_lesson_id(*)
      `)
      .eq('is_infinite', true)
      .lt('instances_generated_until', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()); // Groups with instances less than 7 days ahead

    if (groupsError) {
      throw new Error(`Failed to fetch recurring groups: ${groupsError.message}`);
    }

    console.log(`Found ${recurringGroups?.length || 0} recurring groups needing new instances`);

    let totalInstancesGenerated = 0;

    for (const group of recurringGroups || []) {
      try {
        console.log(`Processing group: ${group.group_name}`);

        const originalLesson = group.original_lesson;
        if (!originalLesson) {
          console.warn(`No original lesson found for group ${group.id}`);
          continue;
        }

        // Check if this recurring series is still active (has instances in last 3 weeks)
        const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
        const lastGenerated = new Date(group.instances_generated_until);

        // If last generation point is recent, check for instances
        if (lastGenerated >= threeWeeksAgo) {
          const { data: recentInstances, error: recentError } = await supabase
            .from('lessons')
            .select('id')
            .eq('parent_lesson_id', originalLesson.id)
            .eq('is_recurring_instance', true)
            .gte('instance_date', threeWeeksAgo.toISOString())
            .limit(1);

          if (!recentError && (!recentInstances || recentInstances.length === 0)) {
            console.log(`No instances in last 3 weeks for ${group.group_name} - series appears cancelled, skipping generation`);
            continue;
          }

          console.log(`Series is active (found recent instances) - proceeding with generation for ${group.group_name}`);
        } else {
          console.log(`Last generation was >3 weeks ago - assuming we're just behind on generation for ${group.group_name}`);
        }

        // Get the most recent lesson instance to use as template (reflects current tutor/student changes)
        const { data: mostRecentInstance, error: recentInstanceError } = await supabase
          .from('lessons')
          .select(`
            *,
            lesson_students(student_id)
          `)
          .eq('parent_lesson_id', originalLesson.id)
          .eq('is_recurring_instance', true)
          .order('instance_date', { ascending: false })
          .limit(1)
          .single();

        let templateLesson;
        let lessonStudents;

        if (mostRecentInstance && !recentInstanceError) {
          console.log(`Using most recent instance as template: ${mostRecentInstance.id}`);
          templateLesson = mostRecentInstance;
          lessonStudents = mostRecentInstance.lesson_students;
        } else {
          console.log(`Using original lesson as template: ${originalLesson.id}`);
          templateLesson = originalLesson;
          
          // Get students for the original lesson
          const { data: originalLessonStudents, error: studentsError } = await supabase
            .from('lesson_students')
            .select('student_id')
            .eq('lesson_id', originalLesson.id);

          if (studentsError) {
            console.error(`Failed to get students for lesson ${originalLesson.id}:`, studentsError);
            continue;
          }
          lessonStudents = originalLessonStudents;
        }

        // Generate next batch of instances (20 at a time)
        const instances = [];
        const lastGeneratedDate = new Date(group.instances_generated_until);
        
        // Extract time components from template lesson (respects schedule changes)
        const templateStartTime = new Date(templateLesson.start_time);
        const templateEndTime = new Date(templateLesson.end_time);
        const startHour = templateStartTime.getUTCHours();
        const startMinute = templateStartTime.getUTCMinutes();
        const lessonDuration = templateEndTime.getTime() - templateStartTime.getTime();

        let currentDate = new Date(lastGeneratedDate);
        let instanceCount = 0;
        const maxInstances = 20;

        // Generate instances for next 3 months
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        while (instanceCount < maxInstances && currentDate <= endDate) {
          // Move to next occurrence based on recurrence interval
          switch (templateLesson.recurrence_interval) {
            case 'daily':
              currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
              break;
            case 'weekly':
              currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'biweekly':
              currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
              break;
            case 'monthly':
              currentDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          if (currentDate <= endDate) {
            // Apply template lesson's time-of-day to the calculated date
            const instanceStartTime = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate(),
              startHour,
              startMinute,
              0
            ));
            const instanceEndTime = new Date(instanceStartTime.getTime() + lessonDuration);

            instances.push({
              title: templateLesson.title,
              description: templateLesson.description || '',
              subject: templateLesson.subject,
              tutor_id: templateLesson.tutor_id,
              start_time: instanceStartTime.toISOString(),
              end_time: instanceEndTime.toISOString(),
              is_group: templateLesson.is_group,
              status: 'scheduled',
              is_recurring: false,
              is_recurring_instance: true,
              parent_lesson_id: originalLesson.id,
              instance_date: currentDate.toISOString().split('T')[0],
              recurrence_interval: null,
              recurrence_end_date: null,
              recurrence_day: null,
              // Don't inherit room details - they will be created fresh by LessonSpace integration
              lesson_space_room_id: null,
              lesson_space_room_url: null,
              lesson_space_space_id: null,
            });

            instanceCount++;
          }
        }

        if (instances.length > 0) {
          console.log(`Generating ${instances.length} instances for ${group.group_name}`);

          // Insert lesson instances
          const { data: insertedLessons, error: lessonsError } = await supabase
            .from('lessons')
            .insert(instances)
            .select('id');

          if (lessonsError) {
            console.error(`Failed to create lesson instances for group ${group.id}:`, lessonsError);
            continue;
          }

          // Add students to all instances
          const lessonStudentsData = [];
          for (const lesson of insertedLessons) {
            for (const studentData of lessonStudents) {
              lessonStudentsData.push({
                lesson_id: lesson.id,
                student_id: studentData.student_id
              });
            }
          }

          if (lessonStudentsData.length > 0) {
            const { error: studentsInsertError } = await supabase
              .from('lesson_students')
              .insert(lessonStudentsData);

            if (studentsInsertError) {
              console.error(`Failed to add students to lesson instances for group ${group.id}:`, studentsInsertError);
              continue;
            }
          }

          // Create LessonSpace rooms and participant URLs for all new instances
          console.log(`Creating LessonSpace rooms and participant URLs for ${insertedLessons.length} new instances`);
          console.log(`⏱️ Adding 250ms delays between requests to respect LessonSpace rate limit (5 req/sec)`);
          
          let roomsCreatedCount = 0;
          let roomsFailedCount = 0;
          const failedLessons: string[] = [];
          
          // Get student IDs for the original lesson
          const { data: originalStudents } = await supabase
            .from('lesson_students')
            .select('student_id')
            .eq('lesson_id', templateLesson.id);
          
          const studentIds = originalStudents?.map(s => s.student_id) || [];
          
          for (const lesson of insertedLessons) {
            try {
              console.log(`Creating LessonSpace room and participant URLs for lesson: ${lesson.id}`);
              
              const { data: roomData, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
                body: {
                  action: 'create-room',
                  lessonId: lesson.id
                }
              });

              if (roomError) {
                console.error(`   ❌ Failed to create room for lesson ${lesson.id} - invoke error`);
                console.error(`   Error: ${JSON.stringify(roomError)}`);
                console.error(`   Message: ${roomError.message}, Status: ${roomError.status}`);
                roomsFailedCount++;
                failedLessons.push(lesson.id);
                
                // Track failed room creation in database
                await supabase.from('failed_room_creations').insert({
                  lesson_id: lesson.id,
                  error_message: roomError.message || 'Unknown error',
                  error_code: roomError.status || null,
                  attempt_count: 1
                });
                
                // Continue with next lesson
                continue;
              }

              if (roomData && roomData.success) {
                console.log(`✅ LessonSpace room and participant URLs created successfully for lesson ${lesson.id} | rid: ${roomData.rid || 'N/A'}`);
                roomsCreatedCount++;
              } else if (roomData && !roomData.success) {
                console.error(`   ❌ Room creation failed - structured error for lesson ${lesson.id}`);
                console.error(`   rid: ${roomData.rid}, stage: ${roomData.stage}, external_status: ${roomData.external_status}`);
                console.error(`   external_body: ${roomData.external_body || 'N/A'}`);
                console.error(`   error: ${roomData.error}`);
                roomsFailedCount++;
                failedLessons.push(lesson.id);
                
                const detailedError = `Stage: ${roomData.stage || 'unknown'} | Status: ${roomData.external_status || 'N/A'} | ${roomData.error || 'Unknown'} | Body: ${roomData.external_body ? roomData.external_body.substring(0, 200) : 'N/A'}`;
                
                // Track failed room creation in database
                await supabase.from('failed_room_creations').insert({
                  lesson_id: lesson.id,
                  error_message: detailedError,
                  error_code: roomData.external_status || null,
                  attempt_count: 1
                });
              } else {
                console.error(`   ❌ Unexpected response format for lesson ${lesson.id}`);
                console.error(`   roomData: ${JSON.stringify(roomData)}`);
                roomsFailedCount++;
                failedLessons.push(lesson.id);
              }
            } catch (roomCreationError) {
              console.error(`❌ Error creating LessonSpace room for lesson ${lesson.id}:`, roomCreationError);
              roomsFailedCount++;
              failedLessons.push(lesson.id);
              
              // Track failed room creation in database
              await supabase.from('failed_room_creations').insert({
                lesson_id: lesson.id,
                error_message: roomCreationError.message || 'Exception during room creation',
                error_code: null,
                attempt_count: 1
              });
            }
            
            // Add 250ms delay between requests to respect LessonSpace rate limit (5 req/sec)
            // This ensures we stay under the limit even with network jitter
            await sleep(250);
          }

          console.log(`📊 LessonSpace Room Creation Summary:`);
          console.log(`   ✅ Success: ${roomsCreatedCount}/${insertedLessons.length}`);
          console.log(`   ❌ Failed: ${roomsFailedCount}/${insertedLessons.length}`);
          if (failedLessons.length > 0) {
            console.log(`   📋 Failed lesson IDs:`, failedLessons);
          }

          // Update the recurring group with new generation info
          const { error: updateError } = await supabase
            .from('recurring_lesson_groups')
            .update({
              instances_generated_until: instances[instances.length - 1].start_time,
              total_instances_generated: group.total_instances_generated + instances.length,
              next_extension_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', group.id);

          if (updateError) {
            console.error(`Failed to update recurring group ${group.id}:`, updateError);
          }

          totalInstancesGenerated += instances.length;
        }
      } catch (error) {
        console.error(`Error processing group ${group.id}:`, error);
        continue;
      }
    }

    console.log(`Completed recurring lesson generation. Total instances generated: ${totalInstancesGenerated}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${totalInstancesGenerated} lesson instances with LessonSpace rooms`,
        groupsProcessed: recurringGroups?.length || 0,
        totalInstancesGenerated
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in generate-recurring-lessons function:", error);
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
