
// Enhanced Netless service functions with comprehensive error handling and logging
export async function createNetlessRoom(sdkToken: string) {
  console.log('[NETLESS] Creating room...');
  
  try {
    if (!sdkToken) {
      throw new Error('SDK token is required');
    }

    console.log('[NETLESS] Making API request to create room...');
    const response = await fetch('https://api.netless.link/v5/rooms', {
      method: 'POST',
      headers: {
        'token': sdkToken,
        'Content-Type': 'application/json',
        'region': 'us-sv'
      },
      body: JSON.stringify({
        isRecord: false
      })
    });

    console.log('[NETLESS] Room creation API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NETLESS] Room creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to create Netless room: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const roomData = await response.json();
    console.log('[NETLESS] Room creation response:', roomData);
    
    if (!roomData.uuid) {
      console.error('[NETLESS] No UUID in room creation response:', roomData);
      throw new Error('No room UUID returned from Netless API');
    }

    console.log('[NETLESS] Room created successfully:', roomData.uuid);
    return roomData.uuid;
  } catch (error) {
    console.error('[NETLESS] Error creating room:', error);
    throw error;
  }
}

export async function generateNetlessRoomToken(sdkToken: string, roomUuid: string, role: 'admin' | 'writer' | 'reader' = 'admin') {
  console.log(`[NETLESS] Generating token for room: ${roomUuid}, role: ${role}`);
  
  try {
    if (!sdkToken) {
      throw new Error('SDK token is required');
    }

    if (!roomUuid) {
      throw new Error('Room UUID is required');
    }

    console.log('[NETLESS] Making API request to generate room token...');
    const response = await fetch(`https://api.netless.link/v5/tokens/rooms/${roomUuid}`, {
      method: 'POST',
      headers: {
        'token': sdkToken,
        'Content-Type': 'application/json',
        'region': 'us-sv'
      },
      body: JSON.stringify({
        lifespan: 3600000, // 1 hour
        role: role
      })
    });

    console.log('[NETLESS] Token generation API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NETLESS] Token generation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        roomUuid: roomUuid,
        role: role
      });
      throw new Error(`Failed to generate room token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle both JSON and direct token response formats
    const contentType = response.headers.get('content-type');
    console.log('[NETLESS] Response content type:', contentType);
    
    let token;
    if (contentType && contentType.includes('application/json')) {
      // JSON response format
      const result = await response.json();
      console.log('[NETLESS] JSON token generation response received');
      token = result.token;
    } else {
      // Direct token response format
      token = await response.text();
      console.log('[NETLESS] Direct token response received');
    }
    
    if (!token || token.trim() === '') {
      console.error('[NETLESS] Empty or null token received');
      throw new Error('Empty token returned from Netless API');
    }

    // Validate token format (should start with NETLESSROOM_)
    if (!token.startsWith('NETLESSROOM_')) {
      console.error('[NETLESS] Invalid token format received:', token.substring(0, 50) + '...');
      throw new Error('Invalid token format returned from Netless API');
    }

    console.log('[NETLESS] Token generated successfully:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...'
    });
    return token;
  } catch (error) {
    console.error('[NETLESS] Error generating token:', error);
    throw error;
  }
}

export function parseNetlessSDKToken(sdkToken: string) {
  try {
    if (!sdkToken) {
      throw new Error('SDK token is required');
    }

    if (!sdkToken.startsWith('NETLESSSDK_')) {
      throw new Error('Invalid SDK token format: must start with NETLESSSDK_');
    }

    const tokenData = sdkToken.replace('NETLESSSDK_', '');
    
    if (!tokenData) {
      throw new Error('Invalid SDK token format: empty token data');
    }

    let decoded;
    try {
      decoded = atob(tokenData);
    } catch (error) {
      throw new Error('Invalid SDK token format: failed to decode base64');
    }

    const params = new URLSearchParams(decoded);
    const appIdentifier = params.get('ak');
    
    if (!appIdentifier) {
      console.error('[NETLESS] Decoded token params:', Array.from(params.entries()));
      throw new Error('Invalid SDK token format: missing app identifier (ak parameter)');
    }
    
    console.log('[NETLESS] SDK token parsed successfully:', {
      appIdentifier: appIdentifier.substring(0, 8) + '...'
    });
    
    return { appIdentifier };
  } catch (error) {
    console.error('[NETLESS] Failed to parse SDK token:', error);
    throw new Error(`Invalid Netless SDK token format: ${error.message}`);
  }
}
