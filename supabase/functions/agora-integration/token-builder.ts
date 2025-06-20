
// Proper Agora token implementation following official binary format specification
export class AgoraTokenBuilder {
  private static crc32Table: number[] = [];

  // Initialize CRC32 table
  private static initCrc32Table() {
    if (this.crc32Table.length > 0) return;
    
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
      }
      this.crc32Table[i] = crc;
    }
  }

  private static crc32(data: Uint8Array): number {
    this.initCrc32Table();
    let crc = 0xFFFFFFFF;
    
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      crc = (crc >>> 8) ^ this.crc32Table[(crc ^ byte) & 0xFF];
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  private static async hmacSha256(secret: string, message: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, message);
    return new Uint8Array(signature);
  }

  private static packUint16(value: number): Uint8Array {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, value, false); // big-endian
    return new Uint8Array(buffer);
  }

  private static packUint32(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, false); // big-endian
    return new Uint8Array(buffer);
  }

  private static packString(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const strBytes = encoder.encode(str);
    const lengthBytes = this.packUint16(strBytes.length);
    return new Uint8Array([...lengthBytes, ...strBytes]);
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

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static buildMessage(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    salt: number,
    ts: number,
    expiredTs: number
  ): Uint8Array {
    // Build the message following Agora's specification
    const appIdBytes = this.packString(appId);
    const channelNameBytes = this.packString(channelName);
    const uidBytes = this.packUint32(uid);
    const saltBytes = this.packUint32(salt);
    const tsBytes = this.packUint32(ts);
    const privilegeExpiredTsBytes = this.packUint32(expiredTs);

    // Service type for RTC
    const serviceType = new Uint8Array([1]);
    
    // Role and privilege map
    const roleBytes = this.packUint32(role);
    const privilegeMapLength = this.packUint32(1); // One privilege
    const privilegeKey = this.packUint32(1); // Join channel privilege
    const privilegeValue = this.packUint32(expiredTs);

    return this.concatArrays(
      serviceType,
      appIdBytes,
      channelNameBytes,
      uidBytes,
      saltBytes,
      tsBytes,
      privilegeMapLength,
      privilegeKey,
      privilegeValue,
      roleBytes
    );
  }

  private static buildRtmMessage(
    appId: string,
    userId: string,
    salt: number,
    ts: number,
    expiredTs: number
  ): Uint8Array {
    // Build RTM message
    const appIdBytes = this.packString(appId);
    const userIdBytes = this.packString(userId);
    const saltBytes = this.packUint32(salt);
    const tsBytes = this.packUint32(ts);
    const privilegeExpiredTsBytes = this.packUint32(expiredTs);

    // Service type for RTM
    const serviceType = new Uint8Array([2]);
    
    // Privilege map for RTM
    const privilegeMapLength = this.packUint32(1);
    const privilegeKey = this.packUint32(1); // RTM login privilege
    const privilegeValue = this.packUint32(expiredTs);

    return this.concatArrays(
      serviceType,
      appIdBytes,
      userIdBytes,
      saltBytes,
      tsBytes,
      privilegeMapLength,
      privilegeKey,
      privilegeValue
    );
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
      console.log('[AGORA-TOKEN] Building RTC token with proper binary format');
      
      const now = Math.floor(Date.now() / 1000);
      const salt = Math.floor(Math.random() * 0xFFFFFFFF);
      const ts = now;
      const expiredTs = privilegeExpiredTs === 0 ? 0 : now + privilegeExpiredTs;

      // Build the message
      const message = this.buildMessage(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        salt,
        ts,
        expiredTs
      );

      // Generate signature
      const signature = await this.hmacSha256(appCertificate, message);

      // Build the final token structure
      const version = new Uint8Array([7, 0, 0]); // Version 007
      const signatureLength = this.packUint32(signature.length);
      const messageLength = this.packUint32(message.length);
      const crc = this.crc32(this.concatArrays(message, signature));
      const crcBytes = this.packUint32(crc);

      const tokenData = this.concatArrays(
        version,
        signatureLength,
        signature,
        messageLength,
        message,
        crcBytes
      );

      const token = this.arrayBufferToBase64(tokenData.buffer);
      
      console.log('[AGORA-TOKEN] RTC token generated:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        version: 'binary-007',
        targetLength: '~155 chars',
        actualLength: token.length
      });

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] RTC token generation failed:', error);
      throw new Error(`RTC token generation failed: ${error.message}`);
    }
  }

  static async buildRtmToken(
    appId: string,
    appCertificate: string,
    userId: string,
    privilegeExpiredTs: number = 0
  ): Promise<string> {
    try {
      console.log('[AGORA-TOKEN] Building RTM token with proper binary format');
      
      const now = Math.floor(Date.now() / 1000);
      const salt = Math.floor(Math.random() * 0xFFFFFFFF);
      const ts = now;
      const expiredTs = privilegeExpiredTs === 0 ? 0 : now + privilegeExpiredTs;

      // Build the message
      const message = this.buildRtmMessage(
        appId,
        userId,
        salt,
        ts,
        expiredTs
      );

      // Generate signature
      const signature = await this.hmacSha256(appCertificate, message);

      // Build the final token structure
      const version = new Uint8Array([7, 0, 0]); // Version 007
      const signatureLength = this.packUint32(signature.length);
      const messageLength = this.packUint32(message.length);
      const crc = this.crc32(this.concatArrays(message, signature));
      const crcBytes = this.packUint32(crc);

      const tokenData = this.concatArrays(
        version,
        signatureLength,
        signature,
        messageLength,
        message,
        crcBytes
      );

      const token = this.arrayBufferToBase64(tokenData.buffer);
      
      console.log('[AGORA-TOKEN] RTM token generated:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        version: 'binary-007',
        targetLength: '~155 chars',
        actualLength: token.length
      });

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] RTM token generation failed:', error);
      throw new Error(`RTM token generation failed: ${error.message}`);
    }
  }
}
