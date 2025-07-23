
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        // Get the most recent lesson instance to use as a template
        // This ensures we use the latest changes applied to the recurring series
        const { data: recentInstance, error: recentError } = await supabase
          .from('lessons')
          .select('*')
          .eq('parent_lesson_id', originalLesson.id)
          .eq('is_recurring_instance', true)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();

        // Use the most recent instance if available, otherwise fall back to original
        const templateLesson = recentInstance || originalLesson;
        
        if (recentError && recentError.code !== 'PGRST116') {
          console.error(`Failed to get recent instance for group ${group.id}:`, recentError);
        }

        console.log(`Using template lesson: ${templateLesson.id} (${recentInstance ? 'recent instance' : 'original lesson'})`);

        // Get students for the original lesson (students list doesn't change)
        const { data: lessonStudents, error: studentsError } = await supabase
          .from('lesson_students')
          .select('student_id')
          .eq('lesson_id', originalLesson.id);

        if (studentsError) {
          console.error(`Failed to get students for lesson ${originalLesson.id}:`, studentsError);
          continue;
        }

        // Calculate the time difference between template and original for pattern preservation
        const templateStartTime = new Date(templateLesson.start_time);
        const originalStartTime = new Date(originalLesson.start_time);
        const timeDifference = templateStartTime.getTime() - originalStartTime.getTime();
        
        // Generate next batch of instances (20 at a time)
        const instances = [];
        const lastGeneratedDate = new Date(group.instances_generated_until);
        const recurrencePattern = group.recurrence_pattern as any;
        const lessonDuration = new Date(templateLesson.end_time).getTime() - new Date(templateLesson.start_time).getTime();

        let currentDate = new Date(lastGeneratedDate);
        let instanceCount = 0;
        const maxInstances = 20;

        // Generate instances for next 3 months
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        while (instanceCount < maxInstances && currentDate <= endDate) {
          // Move to next occurrence based on recurrence interval
          switch (originalLesson.recurrence_interval) {
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
            // Apply the time difference from template to maintain pattern
            const instanceStartTime = new Date(currentDate.getTime() + timeDifference);
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
              // Inherit room details from template lesson
              lesson_space_room_id: templateLesson.lesson_space_room_id,
              lesson_space_room_url: templateLesson.lesson_space_room_url,
              lesson_space_space_id: templateLesson.lesson_space_space_id,
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
        message: `Generated ${totalInstancesGenerated} lesson instances`,
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
