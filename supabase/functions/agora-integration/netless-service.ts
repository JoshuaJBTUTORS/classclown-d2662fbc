
// Netless service functions
export async function createNetlessRoom(sdkToken: string) {
  console.log('[NETLESS] Creating room...');
  
  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NETLESS] Room creation failed:', response.status, errorText);
      throw new Error(`Failed to create Netless room: ${response.statusText}`);
    }

    const roomData = await response.json();
    console.log('[NETLESS] Room created:', roomData.uuid);
    return roomData.uuid;
  } catch (error) {
    console.error('[NETLESS] Error creating room:', error);
    throw error;
  }
}

export async function generateNetlessRoomToken(sdkToken: string, roomUuid: string, role: 'admin' | 'writer' | 'reader' = 'admin') {
  console.log(`[NETLESS] Generating token for room: ${roomUuid}, role: ${role}`);
  
  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NETLESS] Token generation failed:', response.status, errorText);
      throw new Error(`Failed to generate room token: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[NETLESS] Token generated successfully');
    return result.token;
  } catch (error) {
    console.error('[NETLESS] Error generating token:', error);
    throw error;
  }
}

export function parseNetlessSDKToken(sdkToken: string) {
  try {
    const tokenData = sdkToken.replace('NETLESSSDK_', '');
    const decoded = atob(tokenData);
    const params = new URLSearchParams(decoded);
    const appIdentifier = params.get('ak');
    
    if (!appIdentifier) {
      throw new Error('Invalid SDK token format: missing app identifier');
    }
    
    return { appIdentifier };
  } catch (error) {
    console.error('[NETLESS] Failed to parse SDK token:', error);
    throw new Error('Invalid Netless SDK token format');
  }
}
