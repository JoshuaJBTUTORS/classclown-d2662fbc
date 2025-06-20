
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = require('agora-access-token');

// Role constants
const ROLE_PUBLISHER = 1;
const ROLE_SUBSCRIBER = 2;

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appId, appCertificate, channelName, uid, userRole } = req.body;

    console.log('[VERCEL-TOKEN-SERVICE] Generating tokens:', {
      appId: appId?.substring(0, 8) + '...',
      channelName,
      uid,
      userRole
    });

    // Validate input
    if (!appId || !appCertificate || !channelName || !uid || !userRole) {
      return res.status(400).json({ 
        error: 'Missing required parameters: appId, appCertificate, channelName, uid, userRole' 
      });
    }

    // Map user role to Agora role
    const agoraRole = userRole === 'tutor' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    
    // Generate tokens with no expiration (0 means no expiration)
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = 0; // No expiration
    
    // Generate RTC token
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      expireTime
    );

    // Generate RTM token
    const rtmToken = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      uid.toString(),
      expireTime
    );

    console.log('[VERCEL-TOKEN-SERVICE] Tokens generated successfully:', {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      userRole,
      agoraRole: agoraRole === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });

    // Validate token lengths (should be around 140-180 characters)
    if (rtcToken.length < 100 || rtmToken.length < 100) {
      console.error('[VERCEL-TOKEN-SERVICE] Generated tokens too short:', {
        rtcLength: rtcToken.length,
        rtmLength: rtmToken.length
      });
      return res.status(500).json({ error: 'Generated tokens are invalid (too short)' });
    }

    return res.status(200).json({
      success: true,
      rtcToken,
      rtmToken,
      uid,
      channelName,
      role: userRole,
      debug: {
        rtcTokenLength: rtcToken.length,
        rtmTokenLength: rtmToken.length,
        agoraRole: agoraRole === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
        expiration: 'no expiration',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[VERCEL-TOKEN-SERVICE] Error generating tokens:', error);
    return res.status(500).json({ 
      success: false,
      error: `Token generation failed: ${error.message}` 
    });
  }
};
