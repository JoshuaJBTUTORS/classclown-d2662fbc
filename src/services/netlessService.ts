
interface NetlessSDKToken {
  appIdentifier: string;
  region: string;
}

interface NetlessRoomResponse {
  uuid: string;
  teamUUID: string;
  appUUID: string;
  isBan: boolean;
  createdAt: string;
  limit: number;
}

interface NetlessTokenResponse {
  token: string;
}

export class NetlessService {
  private static parseSDKToken(sdkToken: string): NetlessSDKToken {
    try {
      // The SDK token format: NETLESSSDK_<base64_encoded_data>
      const tokenData = sdkToken.replace('NETLESSSDK_', '');
      const decoded = atob(tokenData);
      
      // Parse the decoded token to extract app identifier
      // Format appears to be: ak=<appId>&nonce=<nonce>&role=<role>&sig=<signature>
      const params = new URLSearchParams(decoded);
      const appIdentifier = params.get('ak');
      
      if (!appIdentifier) {
        throw new Error('Invalid SDK token format: missing app identifier');
      }
      
      return {
        appIdentifier,
        region: 'us-sv' // Default region, can be configured
      };
    } catch (error) {
      console.error('Failed to parse Netless SDK token:', error);
      throw new Error('Invalid Netless SDK token format');
    }
  }

  static async createRoom(sdkToken: string): Promise<{ uuid: string; appIdentifier: string }> {
    const { appIdentifier } = this.parseSDKToken(sdkToken);
    
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
      throw new Error(`Failed to create Netless room: ${response.statusText}`);
    }

    const roomData: NetlessRoomResponse = await response.json();
    
    return {
      uuid: roomData.uuid,
      appIdentifier
    };
  }

  static async generateRoomToken(sdkToken: string, roomUuid: string, role: 'admin' | 'writer' | 'reader' = 'admin'): Promise<string> {
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
      throw new Error(`Failed to generate room token: ${response.statusText}`);
    }

    const tokenData: NetlessTokenResponse = await response.json();
    return tokenData.token;
  }

  static getAppIdentifierFromToken(sdkToken: string): string {
    const { appIdentifier } = this.parseSDKToken(sdkToken);
    return appIdentifier;
  }

  static async ensureRoomToken(sdkToken: string, roomUuid: string, userRole: 'tutor' | 'student'): Promise<string> {
    try {
      const role = userRole === 'tutor' ? 'admin' : 'reader';
      return await this.generateRoomToken(sdkToken, roomUuid, role);
    } catch (error) {
      console.error('Failed to generate Netless room token:', error);
      throw new Error('Unable to generate whiteboard access token');
    }
  }
}
