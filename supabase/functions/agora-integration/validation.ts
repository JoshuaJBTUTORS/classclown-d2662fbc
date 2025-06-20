
// Enhanced App ID and Certificate validation
export function validateAgoraCredentials(appId: string, appCertificate: string) {
  console.log('[AGORA-INTEGRATION] Environment check:', {
    hasAppId: !!appId,
    appIdValue: appId ? appId.substring(0, 8) + '...' : 'NOT SET',
    appIdLength: appId?.length || 0,
    hasAppCertificate: !!appCertificate,
    certificateLength: appCertificate?.length || 0,
    hasNetlessToken: !!Deno.env.get("NETLESS_SDK_TOKEN")
  });

  if (!appId || !appCertificate) {
    console.error('[AGORA-INTEGRATION] Missing Agora credentials');
    throw new Error("Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in Supabase secrets");
  }

  // Enhanced App ID validation
  if (appId.length !== 32) {
    console.error('[AGORA-INTEGRATION] Invalid App ID length:', appId.length, 'Expected: 32');
    throw new Error(`Invalid Agora App ID format. Current length: ${appId.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appId)) {
    console.error('[AGORA-INTEGRATION] Invalid App ID format - not hex:', appId);
    throw new Error("Invalid Agora App ID format. Should be 32 character hex string");
  }

  // Enhanced App Certificate validation
  if (appCertificate.length !== 32) {
    console.error('[AGORA-INTEGRATION] Invalid App Certificate length:', appCertificate.length);
    throw new Error(`Invalid Agora App Certificate format. Current length: ${appCertificate.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appCertificate)) {
    console.error('[AGORA-INTEGRATION] Invalid App Certificate format - not hex');
    throw new Error("Invalid Agora App Certificate format. Should be 32 character hex string");
  }

  console.log('[AGORA-INTEGRATION] Credentials validated successfully');
}
