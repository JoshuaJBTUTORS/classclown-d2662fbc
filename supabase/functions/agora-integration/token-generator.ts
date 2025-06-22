
import { AccessToken2, ServiceRtc, ServiceRtm } from "./agora-token.ts";

export async function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: string, expireTime: number) {
  try {
    console.log('[TOKEN-GEN] Generating RTC token with official implementation');
    
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtc = new ServiceRtc(channelName, uid)
    
    // Add privileges based on role
    if (role === 'publisher' || role === 'tutor') {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, expireTime)
    } else {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
    }
    
    token.add_service(serviceRtc)
    return await token.build()
  } catch (error) {
    console.error('[TOKEN-GEN] RTC token generation error:', error);
    throw error;
  }
}

export async function generateRtmToken(appId: string, appCertificate: string, userId: string, expireTime: number) {
  try {
    console.log('[TOKEN-GEN] Generating RTM token with official implementation for Flexible Classroom');
    
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtm = new ServiceRtm(userId)
    serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expireTime)
    token.add_service(serviceRtm)
    
    const generatedToken = await token.build();
    
    // Validate token before returning
    if (!generatedToken || generatedToken.length < 50) {
      throw new Error(`Invalid RTM token generated: ${generatedToken?.length || 0} characters`);
    }
    
    console.log('[TOKEN-GEN] RTM token generated successfully, length:', generatedToken.length);
    return generatedToken;
  } catch (error) {
    console.error('[TOKEN-GEN] RTM token generation error:', error);
    throw error;
  }
}

export async function generateTokensOfficial(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number | null,
  userRole: string,
  customUID?: number
) {
  try {
    console.log('[TOKEN-GEN] Generating tokens for Flexible Classroom with validation:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid: uid,
      userRole,
      customUID
    });

    // Validate inputs
    if (!appId || appId.length !== 32) {
      throw new Error(`Invalid appId: ${appId?.length || 0} characters`);
    }
    
    if (!appCertificate || appCertificate.length !== 32) {
      throw new Error(`Invalid appCertificate: ${appCertificate?.length || 0} characters`);
    }
    
    if (!channelName) {
      throw new Error('Channel name is required');
    }

    // Use custom UID if provided, otherwise handle null UID
    let actualUid = customUID || uid;
    if (actualUid === null || actualUid === undefined) {
      actualUid = Math.floor(Math.random() * 1000000) + 1000;
      console.log('[TOKEN-GEN] Generated fallback UID:', actualUid);
    } else if (customUID) {
      console.log('[TOKEN-GEN] Using custom UID:', customUID);
    }

    // Set token expiration (24 hours by default)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const expireTime = currentTimestamp + 86400 // 24 hours

    // Generate RTC token
    const rtcToken = await generateRtcToken(appId, appCertificate, channelName, actualUid, userRole, expireTime)
    
    // Generate RTM token (critical for Flexible Classroom signaling)
    const rtmToken = await generateRtmToken(appId, appCertificate, actualUid.toString(), expireTime)

    if (!rtcToken || !rtmToken) {
      throw new Error('Failed to generate tokens - one or both tokens are empty');
    }

    // Additional validation for Flexible Classroom
    if (rtmToken.length < 100) {
      console.warn('[TOKEN-GEN] RTM token may be invalid, length:', rtmToken.length);
    }

    console.log('[TOKEN-GEN] Generated tokens successfully for Flexible Classroom:', {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: userRole,
      finalUid: actualUid,
      wasCustomUID: !!customUID,
      channelName: channelName
    });

    return {
      rtcToken,
      rtmToken,
      uid: actualUid
    };
  } catch (error: any) {
    console.error('[TOKEN-GEN] Token generation failed for Flexible Classroom:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
}
