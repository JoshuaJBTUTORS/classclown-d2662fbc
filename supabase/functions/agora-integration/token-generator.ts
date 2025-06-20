
import { AgoraTokenBuilder } from "./token-builder.ts";

// Agora role constants - exactly as used by website
export const ROLE_PUBLISHER = 1;
export const ROLE_SUBSCRIBER = 2;

// Enhanced token validation function
export function validateAgoraToken(token: string, appId: string): boolean {
  try {
    if (!token || token.length < 50) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    // Official Agora tokens should be around 140-180 characters with the new library
    if (token.length < 140 || token.length > 180) {
      console.warn('[VALIDATE] Token length unusual:', token.length, 'Expected: 140-180');
    }

    // Basic structure check - Agora tokens typically start with specific patterns
    if (!token.match(/^[A-Za-z0-9+/=]+$/)) {
      console.error('[VALIDATE] Token contains invalid characters');
      return false;
    }

    console.log('[VALIDATE] Token validation passed - improved library format');
    return true;
  } catch (error) {
    console.error('[VALIDATE] Token validation error:', error);
    return false;
  }
}

// Generate RTC Token using improved library with fallbacks
export async function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number): Promise<string> {
  try {
    console.log('[RTC-TOKEN] Generating with improved Agora library:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role: role === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });

    // Use improved token builder with NO expiration (0 means no expiration)
    const token = await AgoraTokenBuilder.buildRtcToken(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      0 // NO EXPIRATION - same as Agora website default
    );

    console.log('[RTC-TOKEN] Generated token with improved library:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      expectedLength: '140-180 chars',
      actualLength: token.length,
      improvedLibrary: true
    });

    return token;
  } catch (error) {
    console.error('[RTC-TOKEN] Improved library generation failed:', error);
    throw new Error(`RTC token generation failed: ${error.message}`);
  }
}

// Generate RTM Token using improved library with fallbacks
export async function generateRtmToken(appId: string, appCertificate: string, userId: string): Promise<string> {
  try {
    console.log('[RTM-TOKEN] Generating with improved Agora library:', {
      appId: appId.substring(0, 8) + '...',
      userId
    });

    // Use improved token builder with NO expiration
    const token = await AgoraTokenBuilder.buildRtmToken(
      appId,
      appCertificate,
      userId,
      0 // NO EXPIRATION - same as website default
    );

    console.log('[RTM-TOKEN] Generated token with improved library:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      improvedLibrary: true
    });

    return token;
  } catch (error) {
    console.error('[RTM-TOKEN] Improved library generation failed:', error);
    throw new Error(`RTM token generation failed: ${error.message}`);
  }
}
