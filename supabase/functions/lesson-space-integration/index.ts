import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility function for exponential backoff retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, rid?: string): Promise<Response> {
  let lastError;
  const prefix = rid ? `[${rid.substring(0, 8)}]` : '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a 429 (rate limit), wait and retry with exponential backoff
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`${prefix} ⏱️ Rate limited (429). Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
          await sleep(waitTime);
          continue;
        }
      }
      
      // If successful or non-retryable error, return response
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`${prefix} ⚠️ Request failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

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

interface JoinSpaceRequest {
  lessonId: string;
  studentId: number;
  studentName: string;
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
      case "join-space":
        return await joinLessonSpace(requestData as JoinSpaceRequest, supabase);
      case "add-students-to-room":
        return await addStudentsToRoom(requestData, supabase);
      case "update-lesson":
        return await updateLessonWithRoom(requestData as UpdateLessonRequest, supabase);
      case "delete-room":
        return await deleteLessonSpaceRoom(requestData.roomId, supabase);
      case "get-transcription":
        return await getTranscription(requestData.lessonId, supabase);
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

function generateSpaceId(lesson: any): string {
  if (lesson.is_group) {
    // For group lessons: group_{lesson_id}_t{tutor_id}
    const lessonIdShort = lesson.id.substring(0, 8);
    const tutorIdShort = lesson.tutor_id.substring(0, 8);
    return `group_${lessonIdShort}_t${tutorIdShort}`;
  } else {
    // For individual lessons: t{tutor_id}_s{student_id}
    const tutorIdShort = lesson.tutor_id.substring(0, 8);
    const studentId = lesson.lesson_students?.[0]?.student?.id;
    if (!studentId) {
      throw new Error("No student found for individual lesson");
    }
    return `t${tutorIdShort}_s${studentId}`;
  }
}

async function createLessonSpaceRoom(data: CreateRoomRequest, supabase: any) {
  const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY') || "832a4e97-e402-4757-8ba3-a8afb14941b2";
  const rid = crypto.randomUUID();
  let stage = "init";
  let spaceId: string | undefined;
  let external_status: number | undefined;
  let external_body: string | undefined;
  
  try {
    console.log(`[${rid.substring(0, 8)}] 🚀 Creating Lesson Space room | action: create-room | lessonId: ${data.lessonId}`);
    
    stage = "fetch_lesson";
    // Get lesson details to determine if it's a group lesson and get tutor info
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
      console.error(`[${rid.substring(0, 8)}] ❌ Failed to fetch lesson | stage: ${stage} | error: ${lessonError?.message}`);
      throw new Error(`Failed to fetch lesson details: ${lessonError?.message}`);
    }

    if (!lesson.lesson_students || lesson.lesson_students.length === 0) {
      console.error(`[${rid.substring(0, 8)}] ❌ No students found | stage: ${stage} | lessonId: ${data.lessonId}`);
      throw new Error("No students found for this lesson");
    }

    console.log(`[${rid.substring(0, 8)}] 📊 Lesson data | is_group: ${lesson.is_group} | tutor: ${lesson.tutor.first_name} ${lesson.tutor.last_name} (${lesson.tutor.id}) | students: ${lesson.lesson_students.length}`);

    stage = "generate_space_id";
    // Generate space ID based on new logic
    spaceId = generateSpaceId(lesson);
    console.log(`[${rid.substring(0, 8)}] 🔑 Generated space ID: ${spaceId} | stage: ${stage}`);

    // Store all participant URLs
    const participantUrls = [];

    // 1. First create tutor's Launch API URL
    const tutorRequestBody = {
      id: spaceId,
      transcribe: true,
      record_av: true,
      user: {
        id: `tutor_${lesson.tutor.id}`,
        name: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`,
        role: "teacher",
        leader: true, // TUTOR IS LEADER
        custom_jwt_parameters: {
          meta: {
            displayName: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`
          }
        }
      },
      features: {
        invite: true
      }
    };

    stage = "tutor_launch";
    const tutorRequestBodySanitized = { ...tutorRequestBody };
    console.log(`[${rid.substring(0, 8)}] 📤 TUTOR LAUNCH REQUEST | stage: ${stage} | endpoint: https://api.thelessonspace.com/v2/spaces/launch/ | body: ${JSON.stringify(tutorRequestBodySanitized)}`);

    // Create space with teacher as leader using the Launch endpoint with retry logic
    const tutorResponse = await fetchWithRetry("https://api.thelessonspace.com/v2/spaces/launch/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tutorRequestBody),
    }, 3, rid);

    if (!tutorResponse.ok) {
      external_status = tutorResponse.status;
      external_body = await tutorResponse.text();
      const truncatedBody = external_body.substring(0, 1000);
      console.error(`[${rid.substring(0, 8)}] ❌ TUTOR LAUNCH FAILED | stage: ${stage} | status: ${external_status} | lessonId: ${data.lessonId} | spaceId: ${spaceId} | response: ${truncatedBody}`);
      throw new Error(`Failed to create space for tutor: ${external_status} - ${truncatedBody}`);
    }

    const tutorSpaceData = await tutorResponse.json();
    console.log(`[${rid.substring(0, 8)}] ✅ TUTOR SPACE CREATED | room_id: ${tutorSpaceData.room_id} | session_id: ${tutorSpaceData.session_id} | client_url: ${tutorSpaceData.client_url ? 'present' : 'missing'}`);

    // Store tutor URL
    participantUrls.push({
      lesson_id: data.lessonId,
      participant_id: lesson.tutor.id,
      participant_type: 'tutor',
      participant_name: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`,
      launch_url: tutorSpaceData.client_url
    });

    stage = "student_launch";
    // 2. Now create Launch API URLs for all students
    console.log(`[${rid.substring(0, 8)}] 📤 CREATING STUDENT LAUNCH URLS | stage: ${stage} | count: ${lesson.lesson_students.length}`);
    for (const lessonStudent of lesson.lesson_students) {
      const student = lessonStudent.student;
      
      const studentRequestBody = {
        id: spaceId,
        transcribe: true,
        record_av: true,
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
        },
        features: {
          invite: true
        }
      };

      console.log(`[${rid.substring(0, 8)}] 🔄 Creating Launch URL for student: ${student.first_name} ${student.last_name} (ID: ${student.id})`);

      try {
        const studentResponse = await fetchWithRetry("https://api.thelessonspace.com/v2/spaces/launch/", {
          method: "POST",
          headers: {
            "Authorization": `Organisation ${lessonSpaceApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(studentRequestBody),
        }, 3, rid);

        if (studentResponse.ok) {
          const studentSpaceData = await studentResponse.json();
          console.log(`[${rid.substring(0, 8)}] ✅ Student ${student.first_name} ${student.last_name} URL created successfully`);
          
          // Store student URL
          participantUrls.push({
            lesson_id: data.lessonId,
            participant_id: student.id.toString(),
            participant_type: 'student',
            participant_name: `${student.first_name} ${student.last_name}`,
            launch_url: studentSpaceData.client_url
          });
        } else {
          const errorText = await studentResponse.text();
          const truncatedError = errorText.substring(0, 500);
          console.error(`[${rid.substring(0, 8)}] ❌ Failed to create URL for student ${student.first_name} ${student.last_name}: ${studentResponse.status} - ${truncatedError}`);
          // Continue with other students even if one fails
        }
      } catch (studentError) {
        console.error(`[${rid.substring(0, 8)}] ❌ Error creating URL for student ${student.first_name} ${student.last_name}:`, studentError);
        // Continue with other students even if one fails
      }
    }
    console.log(`[${rid.substring(0, 8)}] 📊 Student URLs created: ${participantUrls.filter(p => p.participant_type === 'student').length}/${lesson.lesson_students.length}`);

    stage = "db_upsert";
    // 3. Store all participant URLs in the database using UPSERT
    if (participantUrls.length > 0) {
      console.log(`[${rid.substring(0, 8)}] 🔄 Upserting ${participantUrls.length} participant URLs into database | stage: ${stage}`);
      const { error: urlsError } = await supabase
        .from("lesson_participant_urls")
        .upsert(participantUrls, { 
          onConflict: 'lesson_id,participant_id,participant_type',
          ignoreDuplicates: false 
        });

      if (urlsError) {
        console.error(`[${rid.substring(0, 8)}] ❌ Error upserting participant URLs | stage: ${stage} | error: ${urlsError.message}`);
        // Don't fail the entire operation for this
      } else {
        console.log(`[${rid.substring(0, 8)}] ✅ Successfully upserted ${participantUrls.length} participant URLs in database`);
      }
    }

    stage = "lesson_update";
    // 4. Update the lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: tutorSpaceData.room_id,
        lesson_space_room_url: tutorSpaceData.client_url, // Teacher's authenticated URL
        lesson_space_space_id: spaceId, // Store the space ID for reference
        // lesson_space_session_id: Do NOT set this here - it's created when users join
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error(`[${rid.substring(0, 8)}] ❌ Error updating lesson with room data | stage: ${stage} | error: ${updateError.message}`);
      throw updateError;
    }
    
    console.log(`[${rid.substring(0, 8)}] ✅ Lesson updated successfully | stage: ${stage}`);

    const studentUrlsCount = participantUrls.filter(p => p.participant_type === 'student').length;
    
    console.log(`[${rid.substring(0, 8)}] 🎉 SUCCESS | roomId: ${tutorSpaceData.room_id} | spaceId: ${spaceId} | participantUrls: ${participantUrls.length} | studentUrls: ${studentUrlsCount}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        roomId: tutorSpaceData.room_id,
        roomUrl: tutorSpaceData.client_url, // Teacher's authenticated URL
        teacherUrl: tutorSpaceData.client_url,
        spaceId: spaceId,
        sessionId: tutorSpaceData.session_id,
        participantUrlsCreated: participantUrls.length,
        studentUrlsCreated: studentUrlsCount,
        message: `Lesson space created/updated with authenticated URLs for tutor and ${studentUrlsCount} students.`,
        rid: rid
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${rid.substring(0, 8)}] ❌ FAILED | stage: ${stage} | lessonId: ${data.lessonId} | spaceId: ${spaceId || 'N/A'} | error: ${error.message}`);
    
    // Return 200 with structured error so caller can access details
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        rid: rid,
        stage: stage,
        lessonId: data.lessonId,
        spaceId: spaceId,
        external_status: external_status,
        external_body: external_body ? external_body.substring(0, 1000) : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function joinLessonSpace(data: JoinSpaceRequest, supabase: any) {
  try {
    console.log("Getting pre-generated student URL...", { 
      lessonId: data.lessonId, 
      studentId: data.studentId, 
      studentName: data.studentName 
    });

    // First try to get the pre-generated URL from database
    const { data: participantUrl, error: urlError } = await supabase
      .from("lesson_participant_urls")
      .select("launch_url")
      .eq("lesson_id", data.lessonId)
      .eq("participant_id", data.studentId.toString())
      .eq("participant_type", "student")
      .single();

    if (!urlError && participantUrl) {
      console.log("✅ Found pre-generated student URL in database");
      return new Response(
        JSON.stringify({
          success: true,
          studentUrl: participantUrl.launch_url,
          transcriptionEnabled: true,
          message: "Using pre-generated authenticated URL with transcription enabled"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("⚠️ No pre-generated URL found, falling back to dynamic generation");

    // Fallback: Generate URL dynamically (for students added after room creation)
    const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY') || "832a4e97-e402-4757-8ba3-a8afb14941b2";

    // Get lesson space details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("lesson_space_space_id, lesson_space_room_id, lesson_space_session_id")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Failed to fetch lesson details: ${lessonError?.message}`);
    }

    if (!lesson.lesson_space_space_id) {
      throw new Error("No lesson space found for this lesson");
    }

    // Create request body for student joining the existing space
    const requestBody = {
      id: lesson.lesson_space_space_id,
      transcribe: true,
      record_av: true,
      user: {
        id: `student_${data.studentId}`,
        name: data.studentName,
        role: "student",
        leader: false,
        custom_jwt_parameters: {
          meta: {
            displayName: data.studentName
          }
        }
      },
      features: {
        invite: true
      }
    };

    console.log("=== DYNAMIC STUDENT LAUNCH API REQUEST ===");
    console.log("URL: https://api.thelessonspace.com/v2/spaces/launch/");
    console.log("Student Request Body:", JSON.stringify(requestBody, null, 2));
    console.log("========================================");

    // Get authenticated URL for the student
    const response = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== DYNAMIC STUDENT API ERROR ===");
      console.error("Status:", response.status);
      console.error("Error Text:", errorText);
      console.error("===============================");
      throw new Error(`Failed to get student URL: ${response.status} ${errorText}`);
    }

    const spaceData = await response.json();
    console.log("✅ Dynamic student URL generated successfully");

    // Store this URL for future use using UPSERT
    const { error: storeError } = await supabase
      .from("lesson_participant_urls")
      .upsert({
        lesson_id: data.lessonId,
        participant_id: data.studentId.toString(),
        participant_type: 'student',
        participant_name: data.studentName,
        launch_url: spaceData.client_url
      }, { 
        onConflict: 'lesson_id,participant_id,participant_type',
        ignoreDuplicates: false 
      });

    if (storeError) {
      console.log("⚠️ Could not store dynamically generated URL:", storeError.message);
    } else {
      console.log("✅ Stored dynamically generated URL for future use");
    }

    return new Response(
      JSON.stringify({
        success: true,
        studentUrl: spaceData.client_url,
        transcriptionEnabled: spaceData.room_settings?.transcribe || true,
        message: "Generated new authenticated URL with transcription enabled"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error joining lesson space:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// New function to handle adding students to existing rooms
async function addStudentsToRoom(data: any, supabase: any) {
  const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY') || "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
  try {
    console.log("Adding students to existing room...", data);
    
    const { lessonId, newStudentIds, students } = data;
    
    // Handle both formats: newStudentIds (array of IDs) or students (array of objects)
    const targetStudentIds = newStudentIds || (students ? students.map(s => s.id) : []);
    
    if (!targetStudentIds || targetStudentIds.length === 0) {
      throw new Error("No student IDs provided");
    }
    
    // Get lesson and space details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        lesson_space_space_id,
        lesson_students(
          student:students(id, first_name, last_name, email)
        )
      `)
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson?.lesson_space_space_id) {
      throw new Error("Lesson space not found or not created yet");
    }

    // Filter for new students only
    const newStudents = lesson.lesson_students
      .map(ls => ls.student)
      .filter(student => targetStudentIds.includes(student.id));

    console.log(`Creating URLs for ${newStudents.length} new students`);

    const newParticipantUrls = [];

    // Create Launch API URLs for new students
    for (const student of newStudents) {
      const studentRequestBody = {
        id: lesson.lesson_space_space_id,
        transcribe: true,
        record_av: true,
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
        },
        features: {
          invite: true
        }
      };

      try {
        const studentResponse = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
          method: "POST",
          headers: {
            "Authorization": `Organisation ${lessonSpaceApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(studentRequestBody),
        });

        if (studentResponse.ok) {
          const studentSpaceData = await studentResponse.json();
          console.log(`✅ New student ${student.first_name} ${student.last_name} URL created`);
          
          newParticipantUrls.push({
            lesson_id: lessonId,
            participant_id: student.id.toString(),
            participant_type: 'student',
            participant_name: `${student.first_name} ${student.last_name}`,
            launch_url: studentSpaceData.client_url
          });
        } else {
          console.error(`❌ Failed to create URL for new student ${student.first_name} ${student.last_name}`);
        }
      } catch (studentError) {
        console.error(`❌ Error creating URL for new student ${student.first_name} ${student.last_name}:`, studentError);
      }
    }

    // Store new participant URLs using UPSERT
    if (newParticipantUrls.length > 0) {
      const { error: urlsError } = await supabase
        .from("lesson_participant_urls")
        .upsert(newParticipantUrls, { 
          onConflict: 'lesson_id,participant_id,participant_type',
          ignoreDuplicates: false 
        });

      if (urlsError) {
        console.error("Error upserting new participant URLs:", urlsError);
      } else {
        console.log(`✅ Upserted ${newParticipantUrls.length} new participant URLs`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        newStudentUrlsCreated: newParticipantUrls.length,
        message: `Created authenticated URLs for ${newParticipantUrls.length} new students`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error adding students to room:", error);
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
        lesson_space_space_id: data.provider
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
  try {
    console.log("Deleting Lesson Space room:", roomId);
    
    console.log("Lesson Space spaces are persistent - clearing lesson references only");

    const { data: lessonData, error: lessonFetchError } = await supabase
      .from("lessons")
      .select("id")
      .eq("lesson_space_room_id", roomId)
      .single();

    if (lessonFetchError) {
      console.warn("Could not fetch lesson for room deletion:", lessonFetchError);
    }

    const { error: lessonError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: null,
        lesson_space_room_url: null,
        lesson_space_space_id: null
      })
      .eq("lesson_space_room_id", roomId);

    if (lessonError) throw lessonError;

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

async function getTranscription(lessonId: string, supabase: any) {
  try {
    // Redirect to the dedicated transcription function
    const response = await supabase.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'get-transcription',
        lessonId: lessonId
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return new Response(
      JSON.stringify(response.data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting transcription:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
