
// Manual implementation of Agora token generation using Deno's WebCrypto API
export class AgoraTokenBuilder {
  private static async hmacSha256(secret: string, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static uint32ToBytes(num: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num, false); // big-endian
    return new Uint8Array(buffer);
  }

  private static stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private static concatArrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  static async buildRtcToken(
    appId: string, 
    appCertificate: string, 
    channelName: string, 
    uid: number, 
    role: number, 
    privilegeExpiredTs: number = 0
  ): Promise<string> {
    try {
      console.log('[AGORA-TOKEN] Building RTC token with manual implementation');
      
      // Token version (3 bytes: "007")
      const version = "007";
      
      // Build message for signing
      const appIdBytes = this.stringToBytes(appId);
      const channelNameBytes = this.stringToBytes(channelName);
      const uidBytes = this.uint32ToBytes(uid);
      const roleBytes = this.uint32ToBytes(role);
      const expiredTsBytes = this.uint32ToBytes(privilegeExpiredTs);
      
      // Concatenate all data for signing
      const message = this.concatArrays(
        appIdBytes,
        channelNameBytes,
        uidBytes,
        roleBytes,
        expiredTsBytes
      );
      
      // Sign with HMAC-SHA256
      const signatureBuffer = await this.hmacSha256(appCertificate, new TextDecoder().decode(message));
      const signature = this.arrayBufferToBase64(signatureBuffer);
      
      // Build the final token payload
      const payload = {
        appId,
        channelName,
        uid,
        role,
        privilegeExpiredTs,
        signature
      };
      
      // Base64 encode the payload
      const payloadJson = JSON.stringify(payload);
      const payloadBase64 = btoa(payloadJson);
      
      // Combine version + payload
      const token = version + payloadBase64;
      
      console.log('[AGORA-TOKEN] Manual RTC token generated:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        version: token.substring(0, 3),
        targetLength: '~155 chars'
      });
      
      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] Manual RTC token generation failed:', error);
      throw new Error(`Manual RTC token generation failed: ${error.message}`);
    }
  }

  static async buildRtmToken(
    appId: string,
    appCertificate: string,
    userId: string,
    privilegeExpiredTs: number = 0
  ): Promise<string> {
    try {
      console.log('[AGORA-TOKEN] Building RTM token with manual implementation');
      
      // Token version (3 bytes: "007")
      const version = "007";
      
      // Build message for signing
      const appIdBytes = this.stringToBytes(appId);
      const userIdBytes = this.stringToBytes(userId);
      const expiredTsBytes = this.uint32ToBytes(privilegeExpiredTs);
      
      // Concatenate all data for signing
      const message = this.concatArrays(
        appIdBytes,
        userIdBytes,
        expiredTsBytes
      );
      
      // Sign with HMAC-SHA256
      const signatureBuffer = await this.hmacSha256(appCertificate, new TextDecoder().decode(message));
      const signature = this.arrayBufferToBase64(signatureBuffer);
      
      // Build the final token payload
      const payload = {
        appId,
        userId,
        privilegeExpiredTs,
        signature
      };
      
      // Base64 encode the payload
      const payloadJson = JSON.stringify(payload);
      const payloadBase64 = btoa(payloadJson);
      
      // Combine version + payload
      const token = version + payloadBase64;
      
      console.log('[AGORA-TOKEN] Manual RTM token generated:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        version: token.substring(0, 3),
        targetLength: '~155 chars'
      });
      
      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] Manual RTM token generation failed:', error);
      throw new Error(`Manual RTM token generation failed: ${error.message}`);
    }
  }
}
