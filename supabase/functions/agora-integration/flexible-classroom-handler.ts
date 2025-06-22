
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
    
    console.log('[FLEXIBLE-CLASSROOM] Creating session with improved token generation:', { lessonId, userRole, customUID, displayName });

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

    console.log('[FLEXIBLE-CLASSROOM] Lesson found:', lesson.title);

    // Generate room ID from lesson ID (consistent format)
    const roomId = `lesson_${lessonId.replace(/-/g, '_')}`;
    
    // Use custom UID or generate deterministic one
    let userUuid: string;
    if (customUID) {
      userUuid = customUID.toString();
      console.log('[FLEXIBLE-CLASSROOM] Using custom UID:', userUuid);
    } else if (userRole === 'tutor') {
      // Generate deterministic UUID for tutor from lesson tutor_id
      const tutorHash = lesson.tutor_id.substring(0, 8);
      const tutorNumericId = parseInt(tutorHash, 16) % 100000;
      userUuid = (100000 + tutorNumericId).toString();
      console.log('[FLEXIBLE-CLASSROOM] Generated tutor UID:', userUuid);
    } else {
      userUuid = Math.floor(Math.random() * 1000000).toString();
      console.log('[FLEXIBLE-CLASSROOM] Generated random UID:', userUuid);
    }

    // Generate tokens for signaling - RTM is critical for Flexible Classroom
    console.log('[FLEXIBLE-CLASSROOM] Generating tokens for signaling...');
    const tokenData = await generateTokensOfficial(
      appId,
      appCertificate,
      roomId,
      parseInt(userUuid),
      userRole
    );

    if (!tokenData.rtmToken) {
      throw new Error('Failed to generate RTM token - required for Flexible Classroom signaling');
    }

    // Validate token generation
    if (tokenData.rtmToken.length < 100) {
      console.warn('[FLEXIBLE-CLASSROOM] RTM token seems too short:', tokenData.rtmToken.length);
    }

    console.log('[FLEXIBLE-CLASSROOM] Generated credentials successfully:', {
      roomId,
      userUuid,
      userRole,
      hasRtmToken: !!tokenData.rtmToken,
      rtmTokenLength: tokenData.rtmToken.length,
      rtcTokenLength: tokenData.rtcToken?.length || 0
    });

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

    console.log('[FLEXIBLE-CLASSROOM] Returning response with masked token:', {
      ...response,
      rtmToken: response.rtmToken.substring(0, 20) + '...'
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
    
    // Provide more detailed error info
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = {
      success: false, 
      error: errorMessage,
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    };
    
    console.error('[FLEXIBLE-CLASSROOM] Detailed error response:', errorDetails);
    
    return new Response(
      JSON.stringify(errorDetails),
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
