
// Updated token builder using Deno's npm: specifier with fallbacks
// This should resolve the "Module not found" error from esm.sh

let RtcTokenBuilder, RtcRole, RtmTokenBuilder;

// Try multiple import strategies to ensure compatibility
try {
  // First try: Deno's npm: specifier (most reliable)
  const agoraModule = await import("npm:agora-access-token@2.0.7");
  RtcTokenBuilder = agoraModule.RtcTokenBuilder;
  RtcRole = agoraModule.RtcRole;
  RtmTokenBuilder = agoraModule.RtmTokenBuilder;
  console.log('[AGORA-TOKEN] Successfully imported via npm: specifier');
} catch (npmError) {
  console.warn('[AGORA-TOKEN] npm: import failed, trying Skypack:', npmError.message);
  
  try {
    // Second try: Skypack CDN
    const agoraModule = await import("https://cdn.skypack.dev/agora-access-token@2.0.7");
    RtcTokenBuilder = agoraModule.RtcTokenBuilder;
    RtcRole = agoraModule.RtcRole;
    RtmTokenBuilder = agoraModule.RtmTokenBuilder;
    console.log('[AGORA-TOKEN] Successfully imported via Skypack');
  } catch (skypackError) {
    console.warn('[AGORA-TOKEN] Skypack import failed, trying jsDelivr:', skypackError.message);
    
    try {
      // Third try: jsDelivr CDN
      const agoraModule = await import("https://cdn.jsdelivr.net/npm/agora-access-token@2.0.7/+esm");
      RtcTokenBuilder = agoraModule.RtcTokenBuilder;
      RtcRole = agoraModule.RtcRole;
      RtmTokenBuilder = agoraModule.RtmTokenBuilder;
      console.log('[AGORA-TOKEN] Successfully imported via jsDelivr');
    } catch (jsdelivrError) {
      console.error('[AGORA-TOKEN] All import methods failed:', {
        npm: npmError.message,
        skypack: skypackError.message,
        jsdelivr: jsdelivrError.message
      });
      throw new Error('Failed to import Agora token library from all sources');
    }
  }
}

export class AgoraTokenBuilder {
  static async buildRtcToken(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    privilegeExpiredTs: number = 0
  ): Promise<string> {
    try {
      console.log('[AGORA-TOKEN] Building RTC token with official library');
      
      if (!RtcTokenBuilder || !RtcRole) {
        throw new Error('Agora RTC token builder not properly imported');
      }
      
      // Map our role constants to official library roles
      const rtcRole = role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      
      // Calculate expiration time (0 means no expiration)
      const currentTime = Math.floor(Date.now() / 1000);
      const expireTime = privilegeExpiredTs === 0 ? 0 : currentTime + privilegeExpiredTs;
      
      // Use the official buildTokenWithUid method
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        rtcRole,
        expireTime
      );

      console.log('[AGORA-TOKEN] RTC token generated successfully:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        role: role === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
        uid,
        channelName,
        expectedLength: '~155 chars',
        actualLength: token.length
      });

      // Validate token length is in expected range
      if (token.length < 140 || token.length > 180) {
        console.warn('[AGORA-TOKEN] Token length unusual:', token.length, 'Expected: 140-180');
      }

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] RTC token generation failed:', error);
      throw new Error(`RTC token generation failed: ${error.message}`);
    }
  }

  static async buildRtmToken(
    appId: string,
    appCertificate: string,
    userId: string,
    privilegeExpiredTs: number = 0
  ): Promise<string> {
    try {
      console.log('[AGORA-TOKEN] Building RTM token with official library');
      
      if (!RtmTokenBuilder) {
        throw new Error('Agora RTM token builder not properly imported');
      }
      
      // Calculate expiration time (0 means no expiration)
      const currentTime = Math.floor(Date.now() / 1000);
      const expireTime = privilegeExpiredTs === 0 ? 0 : currentTime + privilegeExpiredTs;
      
      // Use the official RTM token builder
      const token = RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        userId,
        expireTime
      );

      console.log('[AGORA-TOKEN] RTM token generated successfully:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        userId,
        expectedLength: '~155 chars',
        actualLength: token.length
      });

      // Validate token length is in expected range
      if (token.length < 140 || token.length > 180) {
        console.warn('[AGORA-TOKEN] Token length unusual:', token.length, 'Expected: 140-180');
      }

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] RTM token generation failed:', error);
      throw new Error(`RTM token generation failed: ${error.message}`);
    }
  }
}
