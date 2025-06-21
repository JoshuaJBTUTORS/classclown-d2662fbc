
import { parseNetlessSDKToken } from "./netless-service.ts";

export function validateAgoraCredentials(appId: string, appCertificate: string) {
  console.log('[CREDENTIALS] Environment check:', {
    hasAppId: !!appId,
    appIdValue: appId ? appId.substring(0, 8) + '...' : 'NOT SET',
    appIdLength: appId?.length || 0,
    hasAppCertificate: !!appCertificate,
    certificateLength: appCertificate?.length || 0
  });

  if (!appId || !appCertificate) {
    console.error('[CREDENTIALS] Missing Agora credentials');
    throw new Error("Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in Supabase secrets");
  }

  // Enhanced App ID validation
  if (appId.length !== 32) {
    console.error('[CREDENTIALS] Invalid App ID length:', appId.length, 'Expected: 32');
    throw new Error(`Invalid Agora App ID format. Current length: ${appId.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appId)) {
    console.error('[CREDENTIALS] Invalid App ID format - not hex:', appId);
    throw new Error("Invalid Agora App ID format. Should be 32 character hex string");
  }

  // Enhanced App Certificate validation
  if (appCertificate.length !== 32) {
    console.error('[CREDENTIALS] Invalid App Certificate length:', appCertificate.length);
    throw new Error(`Invalid Agora App Certificate format. Current length: ${appCertificate.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appCertificate)) {
    console.error('[CREDENTIALS] Invalid App Certificate format - not hex');
    throw new Error("Invalid Agora App Certificate format. Should be 32 character hex string");
  }

  console.log('[CREDENTIALS] Credentials validated successfully');
}

export function validateNetlessSDKToken(netlessSDKToken: string): boolean {
  try {
    console.log('[CREDENTIALS] Validating Netless SDK token...');
    
    if (!netlessSDKToken) {
      console.error('[CREDENTIALS] Netless SDK token is empty');
      return false;
    }

    if (!netlessSDKToken.startsWith('NETLESSSDK_')) {
      console.error('[CREDENTIALS] Invalid Netless SDK token format - missing prefix');
      return false;
    }

    // Try to parse the token to validate its structure
    const parsedToken = parseNetlessSDKToken(netlessSDKToken);
    console.log('[CREDENTIALS] Netless SDK token validation successful:', {
      appIdentifier: parsedToken.appIdentifier?.substring(0, 8) + '...'
    });
    
    return true;
  } catch (error) {
    console.error('[CREDENTIALS] Netless SDK token validation failed:', error);
    return false;
  }
}
