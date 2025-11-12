import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, startOfWeek, differenceInWeeks, addWeeks } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessingStats {
  lessons_found: number;
  lessons_with_all_urls: number;
  lessons_missing_urls: number;
  tutor_urls_generated: number;
  student_urls_generated: number;
  total_urls_generated: number;
  errors: number;
}

interface LessonDetail {
  lesson_id: string;
  lesson_title: string;
  start_time: string;
  missing_participants: string[];
  urls_generated: number;
  status: 'success' | 'error';
  error_message?: string;
}

// Academic week calculation function (copied from utils)
function getAcademicWeekDateRange(): { weekStart: Date; weekEnd: Date; weekRange: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Calculate academic year start (first Monday of September)
  const academicYearStart = now.getMonth() < 8 
    ? new Date(currentYear - 1, 8, 1) // September 1st of previous year
    : new Date(currentYear, 8, 1); // September 1st of current year
  
  // Find the first Monday of September
  const firstMonday = startOfWeek(academicYearStart, { weekStartsOn: 1 });
  const academicStart = firstMonday.getDate() <= 7 
    ? firstMonday 
    : addWeeks(firstMonday, 1);
  
  // Calculate weeks since academic year start
  const weeksSinceStart = differenceInWeeks(now, academicStart);
  
  // Get current week date range
  const weekStart = addWeeks(academicStart, weeksSinceStart);
  const weekEnd = addWeeks(weekStart, 1);
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  
  return { weekStart, weekEnd, weekRange };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔄 Starting weekly participant URL validation and verification process...');
    console.log('🚀 Function deployment timestamp:', new Date().toISOString());
    
    const stats: ProcessingStats = {
      lessons_found: 0,
      lessons_with_all_urls: 0,
      lessons_missing_urls: 0,
      tutor_urls_generated: 0,
      student_urls_generated: 0,
      total_urls_generated: 0,
      errors: 0,
    };

    const lessonDetails: LessonDetail[] = [];

    // Get current academic week date range
    const { weekStart, weekEnd, weekRange } = getAcademicWeekDateRange();
    const weekStartStr = weekStart.toISOString();
    const weekEndStr = weekEnd.toISOString();
    
    console.log(`📅 Processing lessons for current academic week: ${weekRange}`);
    console.log(`📅 Date range: ${weekStartStr} to ${weekEndStr}`);

    // Fetch all lessons for the current week with participant data
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        tutor_id,
        lesson_space_room_id,
        tutors!inner (
          id,
          first_name,
          last_name,
          email
        ),
        lesson_students!inner (
          student_id,
          students!inner (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .gte('start_time', weekStartStr)
      .lt('start_time', weekEndStr)
      .eq('status', 'scheduled');

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    if (!lessons || lessons.length === 0) {
      console.log('📋 No lessons found for the current week');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No lessons found for current week',
          processing_date: new Date().toISOString().split('T')[0],
          week_range: weekRange,
          stats
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    stats.lessons_found = lessons.length;
    console.log(`📚 Found ${lessons.length} lessons to validate`);

    // Process each lesson
    for (const lesson of lessons) {
      console.log(`\n🔍 Processing lesson: ${lesson.title} (${lesson.id})`);
      
      const lessonDetail: LessonDetail = {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        start_time: lesson.start_time,
        missing_participants: [],
        urls_generated: 0,
        status: 'success'
      };

      try {
        // Get existing participant URLs for this lesson
        const { data: existingUrls, error: urlsError } = await supabase
          .from('lesson_participant_urls')
          .select('participant_id, participant_type')
          .eq('lesson_id', lesson.id);

        if (urlsError) {
          throw new Error(`Failed to fetch existing URLs: ${urlsError.message}`);
        }

        const existingUrlsMap = new Map();
        if (existingUrls) {
          existingUrls.forEach(url => {
            existingUrlsMap.set(`${url.participant_type}_${url.participant_id}`, true);
          });
        }

        // Check if tutor URL exists
        const tutorKey = `tutor_${lesson.tutor_id}`;
        const tutorHasUrl = existingUrlsMap.has(tutorKey);
        
        if (!tutorHasUrl) {
          lessonDetail.missing_participants.push(`Tutor: ${lesson.tutors.first_name} ${lesson.tutors.last_name}`);
        }

        // Check if student URLs exist
        const missingStudents: any[] = [];
        lesson.lesson_students.forEach((ls: any) => {
          const studentKey = `student_${ls.student_id}`;
          if (!existingUrlsMap.has(studentKey)) {
            missingStudents.push(ls.students);
            lessonDetail.missing_participants.push(`Student: ${ls.students.first_name} ${ls.students.last_name}`);
          }
        });

        // If all URLs exist, mark as complete
        if (tutorHasUrl && missingStudents.length === 0) {
          console.log(`✅ All participant URLs already exist for lesson ${lesson.id}`);
          stats.lessons_with_all_urls++;
          lessonDetails.push(lessonDetail);
          continue;
        }

        stats.lessons_missing_urls++;
        console.log(`🔧 Missing URLs for ${lessonDetail.missing_participants.length} participants`);

        // Generate missing URLs using lesson-space-integration
        let roomCreationNeeded = !lesson.lesson_space_room_id || !tutorHasUrl;
        
        if (roomCreationNeeded) {
          console.log(`🏠 Creating room and tutor URL for lesson ${lesson.id}`);
          
          // Create room (which includes tutor URL)
          const { data: roomResult, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
            body: {
              action: 'create-room',
              lessonId: lesson.id,
              title: lesson.title,
              startTime: lesson.start_time,
              duration: 60 // Default duration
            }
          });

          if (roomError) {
            throw new Error(`Failed to create room: ${roomError.message}`);
          }

          if (!tutorHasUrl && roomResult?.success) {
            stats.tutor_urls_generated++;
            lessonDetail.urls_generated++;
            console.log(`✅ Tutor URL generated for lesson ${lesson.id}`);
          }
        }

        // Generate student URLs if needed
        if (missingStudents.length > 0) {
          console.log(`👥 Adding ${missingStudents.length} students to room for lesson ${lesson.id}`);
          
          const { data: studentResult, error: studentError } = await supabase.functions.invoke('lesson-space-integration', {
            body: {
              action: 'add-students-to-room',
              lessonId: lesson.id,
              students: missingStudents.map((student: any) => ({
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email
              }))
            }
          });

          if (studentError) {
            throw new Error(`Failed to add students: ${studentError.message}`);
          }

          if (studentResult?.success) {
            const studentsAdded = missingStudents.length;
            stats.student_urls_generated += studentsAdded;
            lessonDetail.urls_generated += studentsAdded;
            console.log(`✅ ${studentsAdded} student URL(s) generated for lesson ${lesson.id}`);
          }
        }

        stats.total_urls_generated = stats.tutor_urls_generated + stats.student_urls_generated;
        console.log(`🎯 Generated ${lessonDetail.urls_generated} URLs for lesson ${lesson.id}`);

      } catch (error) {
        console.error(`❌ Error processing lesson ${lesson.id}:`, error.message);
        lessonDetail.status = 'error';
        lessonDetail.error_message = error.message;
        stats.errors++;
      }

      lessonDetails.push(lessonDetail);
      
      // Add small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Weekly participant URL validation completed');
    console.log('📈 Final Statistics:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Weekly participant URL validation completed',
        processing_date: new Date().toISOString().split('T')[0],
        week_range: weekRange,
        stats,
        details: lessonDetails.filter(detail => 
          detail.status === 'error' || detail.missing_participants.length > 0
        )
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in ensure-weekly-participant-urls function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});