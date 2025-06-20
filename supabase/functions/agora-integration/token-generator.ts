
import { AgoraTokenBuilder } from "./token-builder.ts";

// Agora role constants - exactly as used by website
export const ROLE_PUBLISHER = 1;
export const ROLE_SUBSCRIBER = 2;

// Enhanced token validation function
export function validateAgoraToken(token: string, appId: string): boolean {
  try {
    if (!token || token.length < 100) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    // Proper Agora tokens should be around 140-160 characters
    if (token.length < 140 || token.length > 200) {
      console.warn('[VALIDATE] Token length unusual:', token.length, 'Expected: 140-160');
    }

    // Check if it's a base64 string (binary tokens are base64 encoded)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(token)) {
      console.error('[VALIDATE] Token is not valid base64');
      return false;
    }

    // Try to decode and check basic structure
    try {
      const decoded = atob(token);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      
      // Check version bytes (should start with 7,0,0 for version 007)
      if (bytes.length >= 3 && bytes[0] === 7 && bytes[1] === 0 && bytes[2] === 0) {
        console.log('[VALIDATE] Token validation passed - proper binary format');
        return true;
      } else {
        console.error('[VALIDATE] Invalid token version:', bytes.slice(0, 3));
        return false;
      }
    } catch (decodeError) {
      console.error('[VALIDATE] Token decode error:', decodeError);
      return false;
    }
  } catch (error) {
    console.error('[VALIDATE] Token validation error:', error);
    return false;
  }
}

// Generate RTC Token using proper binary implementation
export async function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number): Promise<string> {
  try {
    console.log('[RTC-TOKEN] Generating with proper binary implementation:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role: role === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });

    // Use proper binary implementation with NO expiration (0 means no expiration)
    const token = await AgoraTokenBuilder.buildRtcToken(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      0 // NO EXPIRATION - same as Agora website default
    );

    console.log('[RTC-TOKEN] Generated token with proper binary format:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      expectedLength: '140-160 chars',
      actualLength: token.length,
      binaryFormat: true
    });

    return token;
  } catch (error) {
    console.error('[RTC-TOKEN] Binary generation failed:', error);
    throw new Error(`RTC token generation failed: ${error.message}`);
  }
}

// Generate RTM Token using proper binary implementation
export async function generateRtmToken(appId: string, appCertificate: string, userId: string): Promise<string> {
  try {
    console.log('[RTM-TOKEN] Generating with proper binary implementation:', {
      appId: appId.substring(0, 8) + '...',
      userId
    });

    // Use proper binary implementation with NO expiration
    const token = await AgoraTokenBuilder.buildRtmToken(
      appId,
      appCertificate,
      userId,
      0 // NO EXPIRATION - same as website default
    );

    console.log('[RTM-TOKEN] Generated token with proper binary format:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      binaryFormat: true
    });

    return token;
  } catch (error) {
    console.error('[RTM-TOKEN] Binary generation failed:', error);
    throw new Error(`RTM token generation failed: ${error.message}`);
  }
}
