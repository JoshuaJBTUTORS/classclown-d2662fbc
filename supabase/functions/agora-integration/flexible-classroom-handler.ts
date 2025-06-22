
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
  try {
    const { lessonId, userRole, customUID, displayName } = requestData;
    
    console.log('[FLEXIBLE-CLASSROOM] Creating simplified session:', { lessonId, userRole, customUID, displayName });

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('[FLEXIBLE-CLASSROOM] Lesson fetch error:', lessonError);
      throw new Error(`Lesson not found: ${lessonError?.message || 'Unknown error'}`);
    }

    // Generate room ID from lesson ID
    const roomId = `lesson_${lessonId.replace(/-/g, '_')}`;
    
    // Use custom UID or generate one
    let userUuid: string;
    if (customUID) {
      userUuid = customUID.toString();
    } else if (userRole === 'tutor') {
      const tutorHash = lesson.tutor_id.substring(0, 8);
      const tutorNumericId = parseInt(tutorHash, 16) % 100000;
      userUuid = (100000 + tutorNumericId).toString();
    } else {
      userUuid = Math.floor(Math.random() * 1000000).toString();
    }

    console.log('[FLEXIBLE-CLASSROOM] Generated identifiers:', { roomId, userUuid, userRole });

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
      lessonTitle: lesson.title
    };

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
        error: error.message || 'Unknown error occurred'
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
