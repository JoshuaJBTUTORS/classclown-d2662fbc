
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateRoomRequest {
  lessonId: string;
  title: string;
  startTime: string;
  duration?: number;
}

interface UpdateLessonRequest {
  lessonId: string;
  roomId?: string;
  roomUrl?: string;
  provider?: string;
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

    const { action, ...requestData } = await req.json();

    switch (action) {
      case "create-room":
        return await createLessonSpaceRoom(requestData as CreateRoomRequest, supabase);
      case "update-lesson":
        return await updateLessonWithRoom(requestData as UpdateLessonRequest, supabase);
      case "delete-room":
        return await deleteLessonSpaceRoom(requestData.roomId, supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in lesson-space-integration function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createLessonSpaceRoom(data: CreateRoomRequest, supabase: any) {
  const lessonSpaceApiKey = "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
  try {
    console.log("Creating Lesson Space room for lesson:", data.lessonId);
    
    // First, get lesson details to determine if it's a group lesson and get tutor/student info
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        *,
        tutor:tutors(id, first_name, last_name, email),
        lesson_students(
          id,
          student:students(id, first_name, last_name, email)
        )
      `)
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Failed to fetch lesson details: ${lessonError?.message}`);
    }

    if (!lesson.lesson_students || lesson.lesson_students.length === 0) {
      throw new Error("No students found for this lesson");
    }

    // Generate space ID based on lesson type (ensuring it's under 64 characters)
    let spaceId: string;
    if (lesson.is_group) {
      // For group lessons: group_{shortened_lesson_id}
      spaceId = `group_${data.lessonId.substring(0, 30)}`;
    } else {
      // For individual lessons: tutor_{tutor_id}_student_{student_id}
      const studentId = lesson.lesson_students[0]?.student?.id;
      if (!studentId) {
        throw new Error("No student found for individual lesson");
      }
      spaceId = `t${lesson.tutor_id.substring(0, 8)}_s${studentId}`;
    }

    console.log("Generated space ID:", spaceId);

    // Create space with teacher as leader using the Launch endpoint
    console.log("Creating teacher space with API key:", lessonSpaceApiKey);
    const spaceResponse = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: spaceId,
        user: {
          id: `tutor_${lesson.tutor.id}`,
          name: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`,
          role: "teacher",
          leader: true,
          custom_jwt_parameters: {
            meta: {
              displayName: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`
            }
          }
        }
      }),
    });

    if (!spaceResponse.ok) {
      const errorText = await spaceResponse.text();
      console.error("Lesson Space API error for teacher:", spaceResponse.status, errorText);
      throw new Error(`Failed to create space for teacher: ${spaceResponse.status} ${errorText}`);
    }

    const spaceData = await spaceResponse.json();
    console.log("Created/Retrieved Lesson Space for teacher:", spaceData);

    // Track successful student URL generations
    const successfulStudentUpdates = [];
    const failedStudentUpdates = [];

    // Generate and store individual student URLs
    for (const lessonStudent of lesson.lesson_students) {
      const student = lessonStudent.student;
      
      try {
        console.log(`Creating URL for student: ${student.first_name} ${student.last_name} (ID: ${student.id})`);
        
        // Create student-specific URL by calling launch again for each student
        const studentResponse = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
          method: "POST",
          headers: {
            "Authorization": `Organisation ${lessonSpaceApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: spaceId, // Same space ID
            user: {
              id: `student_${student.id}`,
              name: `${student.first_name} ${student.last_name}`,
              role: "student",
              leader: false,
              custom_jwt_parameters: {
                meta: {
                  displayName: `${student.first_name} ${student.last_name}`
                }
              }
            }
          }),
        });

        if (!studentResponse.ok) {
          const errorText = await studentResponse.text();
          console.error(`Failed to create URL for student ${student.id}:`, studentResponse.status, errorText);
          failedStudentUpdates.push({
            studentId: student.id,
            lessonStudentId: lessonStudent.id,
            error: `API call failed: ${studentResponse.status} ${errorText}`
          });
          continue;
        }

        const studentData = await studentResponse.json();
        console.log(`Generated URL for student ${student.id}:`, studentData.client_url);
        
        // Validate that the student URL is different from teacher URL
        if (studentData.client_url === spaceData.client_url) {
          console.warn(`Student URL is the same as teacher URL for student ${student.id}`);
        }
        
        // Store the individual student URL in the lesson_students table
        const { error: updateError } = await supabase
          .from("lesson_students")
          .update({
            lesson_space_url: studentData.client_url
          })
          .eq("id", lessonStudent.id);

        if (updateError) {
          console.error(`Error storing URL for student ${student.id}:`, updateError);
          failedStudentUpdates.push({
            studentId: student.id,
            lessonStudentId: lessonStudent.id,
            error: `Database update failed: ${updateError.message}`
          });
        } else {
          console.log(`Successfully stored URL for student ${student.id}`);
          successfulStudentUpdates.push({
            studentId: student.id,
            lessonStudentId: lessonStudent.id,
            url: studentData.client_url
          });
        }
      } catch (studentError) {
        console.error(`Error processing student ${student.id}:`, studentError);
        failedStudentUpdates.push({
          studentId: student.id,
          lessonStudentId: lessonStudent.id,
          error: `Exception: ${studentError.message}`
        });
      }
    }

    // Log the results
    console.log(`Student URL generation completed: ${successfulStudentUpdates.length} successful, ${failedStudentUpdates.length} failed`);
    if (failedStudentUpdates.length > 0) {
      console.error("Failed student updates:", failedStudentUpdates);
    }

    // Update the lesson with room details (teacher URL)
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: spaceData.room_id,
        lesson_space_room_url: spaceData.client_url, // Teacher URL
        video_conference_provider: "lesson_space",
        video_conference_link: spaceData.client_url
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("Error updating lesson with room data:", updateError);
      throw updateError;
    }

    // Return success with detailed information
    const response = {
      success: true,
      roomId: spaceData.room_id,
      roomUrl: spaceData.client_url, // Teacher URL
      teacherUrl: spaceData.client_url,
      spaceId: spaceId,
      sessionId: spaceData.session_id,
      studentUrlsGenerated: successfulStudentUpdates.length,
      studentUrlsFailure: failedStudentUpdates.length
    };

    // If some student URLs failed but teacher URL succeeded, still return success but log warnings
    if (failedStudentUpdates.length > 0) {
      console.warn(`Room created but ${failedStudentUpdates.length} student URLs failed to generate`);
      response.warnings = failedStudentUpdates;
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Lesson Space room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function updateLessonWithRoom(data: UpdateLessonRequest, supabase: any) {
  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: data.roomId,
        lesson_space_room_url: data.roomUrl,
        video_conference_provider: data.provider || "lesson_space",
        video_conference_link: data.roomUrl
      })
      .eq("id", data.lessonId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating lesson:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function deleteLessonSpaceRoom(roomId: string, supabase: any) {
  const lessonSpaceApiKey = "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
  try {
    console.log("Deleting Lesson Space room:", roomId);
    
    // Note: Lesson Space doesn't provide a direct delete endpoint for spaces
    // Spaces are designed to be persistent. We'll just clear the lesson references
    console.log("Lesson Space spaces are persistent - clearing lesson references only");

    // Get the lesson ID first to clear student URLs
    const { data: lessonData, error: lessonFetchError } = await supabase
      .from("lessons")
      .select("id")
      .eq("lesson_space_room_id", roomId)
      .single();

    if (lessonFetchError) {
      console.warn("Could not fetch lesson for room deletion:", lessonFetchError);
    }

    // Update lesson to remove room details
    const { error: lessonError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: null,
        lesson_space_room_url: null,
        video_conference_provider: null,
        video_conference_link: null
      })
      .eq("lesson_space_room_id", roomId);

    if (lessonError) throw lessonError;

    // Clear student URLs from lesson_students table
    if (lessonData?.id) {
      const { error: studentError } = await supabase
        .from("lesson_students")
        .update({
          lesson_space_url: null
        })
        .eq("lesson_id", lessonData.id);

      if (studentError) {
        console.error("Error clearing student URLs:", studentError);
      } else {
        console.log("Successfully cleared student URLs for lesson:", lessonData.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
