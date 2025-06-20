
import { AgoraTokenBuilder } from "./token-builder.ts";

// Agora role constants - exactly as used by website
export const ROLE_PUBLISHER = 1;
export const ROLE_SUBSCRIBER = 2;

// Token validation function - updated to check for manual token format
export function validateAgoraToken(token: string, appId: string): boolean {
  try {
    if (!token || token.length < 100) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    // Check for expected token length (targeting ~155 chars like Agora website)
    if (token.length > 200) {
      console.warn('[VALIDATE] Token unexpectedly long:', token.length, 'Expected: ~155');
    }

    // Agora tokens should start with '007'
    if (!token.startsWith('007')) {
      console.error('[VALIDATE] Invalid token version:', token.substring(0, 3));
      return false;
    }

    console.log('[VALIDATE] Token validation passed', {
      length: token.length,
      prefix: token.substring(0, 10) + '...'
    });
    return true;
  } catch (error) {
    console.error('[VALIDATE] Token validation error:', error);
    return false;
  }
}

// Generate RTC Token using manual implementation
export async function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number): Promise<string> {
  try {
    console.log('[RTC-TOKEN] Generating with manual Deno-compatible implementation:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role: role === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });

    // Use manual implementation with NO expiration (0 means no expiration)
    const token = await AgoraTokenBuilder.buildRtcToken(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      0 // NO EXPIRATION - same as Agora website default
    );

    console.log('[RTC-TOKEN] Generated token with manual implementation:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      expectedLength: '~155 chars',
      actualLength: token.length,
      denoCompatible: true
    });

    return token;
  } catch (error) {
    console.error('[RTC-TOKEN] Manual generation failed:', error);
    throw new Error(`RTC token generation failed: ${error.message}`);
  }
}

// Generate RTM Token using manual implementation
export async function generateRtmToken(appId: string, appCertificate: string, userId: string): Promise<string> {
  try {
    console.log('[RTM-TOKEN] Generating with manual Deno-compatible implementation:', {
      appId: appId.substring(0, 8) + '...',
      userId
    });

    // Use manual implementation with NO expiration
    const token = await AgoraTokenBuilder.buildRtmToken(
      appId,
      appCertificate,
      userId,
      0 // NO EXPIRATION - same as website default
    );

    console.log('[RTM-TOKEN] Generated token with manual implementation:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      denoCompatible: true
    });

    return token;
  } catch (error) {
    console.error('[RTM-TOKEN] Manual generation failed:', error);
    throw new Error(`RTM token generation failed: ${error.message}`);
  }
}
