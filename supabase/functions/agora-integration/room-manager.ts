
import { createNetlessRoom, generateNetlessRoomToken, parseNetlessSDKToken } from "./netless-service.ts";
import { validateNetlessSDKToken } from "./credentials-validator.ts";

export async function createNetlessRoomWithToken(netlessSDKToken: string, userRole: string) {
  try {
    console.log('[ROOM-MGR] Creating Netless room and token for role:', userRole);
    
    // Validate SDK token first
    if (!validateNetlessSDKToken(netlessSDKToken)) {
      throw new Error('Invalid Netless SDK token');
    }

    // Create the room
    console.log('[ROOM-MGR] Creating Netless room...');
    const roomUuid = await createNetlessRoom(netlessSDKToken);
    
    if (!roomUuid) {
      throw new Error('Failed to create Netless room - no UUID returned');
    }

    console.log('[ROOM-MGR] Netless room created successfully:', roomUuid);

    // Parse app identifier from SDK token
    const parsedToken = parseNetlessSDKToken(netlessSDKToken);
    const appIdentifier = parsedToken.appIdentifier;

    if (!appIdentifier) {
      throw new Error('Failed to parse app identifier from SDK token');
    }

    // Generate room token
    console.log('[ROOM-MGR] Generating Netless room token for role:', userRole);
    const role = userRole === 'tutor' ? 'admin' : 'reader';
    const roomToken = await generateNetlessRoomToken(netlessSDKToken, roomUuid, role);

    if (!roomToken) {
      console.error('[ROOM-MGR] Failed to generate room token - null returned');
      throw new Error('Failed to generate Netless room token');
    }

    console.log('[ROOM-MGR] Netless room token generated successfully');

    return {
      roomUuid,
      roomToken,
      appIdentifier
    };
  } catch (error) {
    console.error('[ROOM-MGR] Error in createNetlessRoomWithToken:', error);
    throw new Error(`Netless room creation failed: ${error.message}`);
  }
}
