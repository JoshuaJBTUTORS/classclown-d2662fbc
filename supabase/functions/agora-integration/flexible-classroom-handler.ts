
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
    const { lessonId, userRole, customUID } = requestData;
    
    console.log('[FLEXIBLE-CLASSROOM] Creating session for lesson:', lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error('Lesson not found');
    }

    // Generate room ID from lesson ID
    const roomId = `lesson_${lessonId.replace(/-/g, '_')}`;
    
    // Use custom UID or generate from lesson tutor ID
    let userUuid: string;
    if (customUID) {
      userUuid = customUID.toString();
    } else if (userRole === 'tutor') {
      // Generate deterministic UUID for tutor from lesson tutor_id
      const tutorHash = lesson.tutor_id.substring(0, 8);
      const tutorNumericId = parseInt(tutorHash, 16) % 100000;
      userUuid = (100000 + tutorNumericId).toString();
    } else {
      userUuid = Math.floor(Math.random() * 1000000).toString();
    }

    // Generate RTM token for signaling
    const tokenData = await generateTokensOfficial(
      appId,
      appCertificate,
      roomId,
      parseInt(userUuid),
      userRole
    );

    console.log('[FLEXIBLE-CLASSROOM] Generated credentials:', {
      roomId,
      userUuid,
      userRole,
      hasRtmToken: !!tokenData.rtmToken
    });

    return new Response(
      JSON.stringify({
        success: true,
        roomId,
        userUuid,
        userName: `User ${userUuid}`,
        userRole: userRole === 'tutor' ? 'teacher' : 'student',
        rtmToken: tokenData.rtmToken,
        appId,
        lessonTitle: lesson.title
      }),
      { 
        status: 200, 
        headers: { 
          ...{ "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error('[FLEXIBLE-CLASSROOM] Error creating session:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...{ "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
}
