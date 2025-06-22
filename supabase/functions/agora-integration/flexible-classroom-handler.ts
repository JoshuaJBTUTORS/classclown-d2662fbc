
import { generateTokensOfficial } from "./token-generator.ts";

export interface FlexibleClassroomCredentials {
  roomId: string;
  userUuid: string;
  userName: string;
  userRole: 'teacher' | 'student';
  rtmToken: string;
  appId: string;
}

export async function createFlexibleClassroomSession(
  requestData: any,
  supabase: any,
  appId: string,
  appCertificate: string
) {
  console.log('[FLEXIBLE-CLASSROOM] Starting session creation');
  
  try {
    const { lessonId, userRole, customUID, displayName } = requestData;
    
    console.log('[FLEXIBLE-CLASSROOM] Creating session with data:', { lessonId, userRole, customUID, displayName });

    // Validate required parameters
    if (!lessonId) {
      throw new Error('lessonId is required');
    }
    if (!userRole) {
      throw new Error('userRole is required');
    }

    console.log('[FLEXIBLE-CLASSROOM] Fetching lesson details...');
    
    // Get lesson details with better error handling
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      console.error('[FLEXIBLE-CLASSROOM] Lesson fetch error:', lessonError);
      throw new Error(`Failed to fetch lesson: ${lessonError.message}`);
    }

    if (!lesson) {
      throw new Error(`Lesson not found with ID: ${lessonId}`);
    }

    console.log('[FLEXIBLE-CLASSROOM] Lesson found:', lesson.title);

    // Generate room ID from lesson ID (ensure it's valid for Agora)
    const roomId = `lesson_${lessonId.replace(/-/g, '_')}`;
    
    // Use custom UID or generate deterministic one
    let userUuid: string;
    if (customUID) {
      userUuid = customUID.toString();
    } else if (userRole === 'tutor') {
      // Generate deterministic UID for tutor based on lesson tutor_id
      if (lesson.tutor_id) {
        const tutorHash = lesson.tutor_id.substring(0, 8);
        const tutorNumericId = parseInt(tutorHash, 16) % 100000;
        userUuid = (100000 + tutorNumericId).toString();
      } else {
        userUuid = '100001'; // Default tutor UID
      }
    } else {
      // Generate random UID for student (can be improved with student ID mapping)
      userUuid = Math.floor(Math.random() * 1000000).toString();
    }

    console.log('[FLEXIBLE-CLASSROOM] Generated identifiers:', { roomId, userUuid, userRole });

    console.log('[FLEXIBLE-CLASSROOM] Generating tokens...');
    
    // Generate RTM token (essential for Flexible Classroom)
    const tokenData = await generateTokensOfficial(
      appId,
      appCertificate,
      roomId,
      parseInt(userUuid),
      userRole
    );

    if (!tokenData.rtmToken) {
      throw new Error('Failed to generate RTM token - required for Flexible Classroom');
    }

    console.log('[FLEXIBLE-CLASSROOM] Token generated successfully');

    const response = {
      success: true,
      roomId,
      userUuid,
      userName: displayName || `User ${userUuid}`,
      userRole: userRole === 'tutor' ? 'teacher' : 'student',
      rtmToken: tokenData.rtmToken,
      appId,
      lessonTitle: lesson.title || 'Lesson'
    };

    console.log('[FLEXIBLE-CLASSROOM] Response prepared:', { 
      ...response, 
      rtmToken: response.rtmToken ? '[PRESENT]' : '[MISSING]' 
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          "Access-Control-Allow-Origin": "*", 
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error: any) {
    console.error('[FLEXIBLE-CLASSROOM] Error creating session:', error);
    
    return new Response(
      JSON.stringify({
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          "Access-Control-Allow-Origin": "*", 
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Content-Type": "application/json" 
        } 
      }
    );
  }
}
