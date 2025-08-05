import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🧹 Starting comprehensive demo data cleanup...');

    // Step 1: Delete lesson-related demo data
    console.log('📚 Cleaning up lesson-related demo data...');
    
    // Delete lesson attendance for demo lessons
    const { error: attendanceError } = await supabaseClient
      .from('lesson_attendance')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (attendanceError) {
      console.error('Error deleting demo lesson attendance:', attendanceError);
    }

    // Delete lesson student associations for demo lessons
    const { error: lessonStudentsError } = await supabaseClient
      .from('lesson_students')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (lessonStudentsError) {
      console.error('Error deleting demo lesson students:', lessonStudentsError);
    }

    // Delete homework submissions for demo homework
    const { error: submissionsError } = await supabaseClient
      .from('homework_submissions')
      .delete()
      .in('homework_id', 
        supabaseClient
          .from('homework')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (submissionsError) {
      console.error('Error deleting demo homework submissions:', submissionsError);
    }

    // Delete demo homework
    const { error: homeworkError } = await supabaseClient
      .from('homework')
      .delete()
      .eq('is_demo_data', true);

    if (homeworkError) {
      console.error('Error deleting demo homework:', homeworkError);
    }

    // Delete lesson transcriptions for demo lessons
    const { error: transcriptionsError } = await supabaseClient
      .from('lesson_transcriptions')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (transcriptionsError) {
      console.error('Error deleting demo lesson transcriptions:', transcriptionsError);
    }

    // Delete lesson summaries for demo lessons
    const { error: summariesError } = await supabaseClient
      .from('lesson_student_summaries')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (summariesError) {
      console.error('Error deleting demo lesson summaries:', summariesError);
    }

    // Delete lesson participant URLs for demo lessons
    const { error: participantUrlsError } = await supabaseClient
      .from('lesson_participant_urls')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (participantUrlsError) {
      console.error('Error deleting demo lesson participant URLs:', participantUrlsError);
    }

    // Delete lesson plan assignments for demo lessons
    const { error: planAssignmentsError } = await supabaseClient
      .from('lesson_plan_assignments')
      .delete()
      .in('lesson_id', 
        supabaseClient
          .from('lessons')
          .select('id')
          .eq('is_demo_data', true)
      );

    if (planAssignmentsError) {
      console.error('Error deleting demo lesson plan assignments:', planAssignmentsError);
    }

    // Step 2: Delete demo sessions
    console.log('🎭 Cleaning up demo sessions...');
    const { error: demoSessionsError } = await supabaseClient
      .from('demo_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (demoSessionsError) {
      console.error('Error deleting demo sessions:', demoSessionsError);
    }

    // Step 3: Delete demo lessons (this will cascade to related data if foreign keys are set up)
    console.log('📝 Deleting demo lessons...');
    const { data: deletedLessons, error: lessonsError } = await supabaseClient
      .from('lessons')
      .delete()
      .eq('is_demo_data', true)
      .select('id');

    if (lessonsError) {
      console.error('Error deleting demo lessons:', lessonsError);
    } else {
      console.log(`✅ Deleted ${deletedLessons?.length || 0} demo lessons`);
    }

    // Step 4: Clean up demo user data
    console.log('👥 Cleaning up demo user data...');
    
    // Delete demo students
    const { data: deletedStudents, error: studentsError } = await supabaseClient
      .from('students')
      .delete()
      .eq('is_demo_data', true)
      .select('id');

    if (studentsError) {
      console.error('Error deleting demo students:', studentsError);
    } else {
      console.log(`✅ Deleted ${deletedStudents?.length || 0} demo students`);
    }

    // Delete demo parents
    const { data: deletedParents, error: parentsError } = await supabaseClient
      .from('parents')
      .delete()
      .eq('is_demo_data', true)
      .select('id');

    if (parentsError) {
      console.error('Error deleting demo parents:', parentsError);
    } else {
      console.log(`✅ Deleted ${deletedParents?.length || 0} demo parents`);
    }

    // Delete demo tutors
    const { data: deletedTutors, error: tutorsError } = await supabaseClient
      .from('tutors')
      .delete()
      .eq('is_demo_data', true)
      .select('id');

    if (tutorsError) {
      console.error('Error deleting demo tutors:', tutorsError);
    } else {
      console.log(`✅ Deleted ${deletedTutors?.length || 0} demo tutors`);
    }

    // Step 5: Clean up demo courses if they exist
    console.log('📚 Cleaning up demo courses...');
    const { data: deletedCourses, error: coursesError } = await supabaseClient
      .from('courses')
      .delete()
      .eq('is_demo_data', true)
      .select('id');

    if (coursesError) {
      console.error('Error deleting demo courses:', coursesError);
    } else {
      console.log(`✅ Deleted ${deletedCourses?.length || 0} demo courses`);
    }

    // Step 6: Set demo cleanup flag
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
        deleted: {
          lessons: deletedLessons?.length || 0,
          students: deletedStudents?.length || 0,
          parents: deletedParents?.length || 0,
          tutors: deletedTutors?.length || 0,
          courses: deletedCourses?.length || 0
        }
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