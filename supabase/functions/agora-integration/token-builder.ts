
// Simple wrapper around the official Agora token library
// This replaces our complex custom implementation with the proven official solution

import { RtcTokenBuilder, RtcRole, RtmTokenBuilder } from "https://esm.sh/agora-access-token@2.0.7";

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

      console.log('[AGORA-TOKEN] RTC token generated with official library:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        role: role === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
        uid,
        channelName
      });

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

      console.log('[AGORA-TOKEN] RTM token generated with official library:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        userId
      });

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] RTM token generation failed:', error);
      throw new Error(`RTM token generation failed: ${error.message}`);
    }
  }
}
