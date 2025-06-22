
// Education Token Builder for Agora Flexible Classroom
// Ported from Go implementation

import { Buffer } from 'https://deno.land/std@0.155.0/node/buffer.ts'
import { encodeHMac } from './agora-token.ts'

const EDUCATION_TOKEN_VERSION = '007'

// Education token privileges
const EDUCATION_PRIVILEGES = {
  ROOM_USER: 1,
  USER: 2,
  APP: 3
}

// User roles for education token
const EDUCATION_ROLES = {
  TEACHER: 1,
  STUDENT: 2,
  ASSISTANT: 3,
  OBSERVER: 4
}

interface EducationTokenOptions {
  appId: string
  appCertificate: string
  roomUuid: string
  userUuid: string
  role: number
  expire: number
}

class EducationTokenBuilder {
  private appId: string
  private appCertificate: string
  private roomUuid: string
  private userUuid: string
  private role: number
  private expire: number
  private issueTs: number
  private salt: number

  constructor(options: EducationTokenOptions) {
    this.appId = options.appId
    this.appCertificate = options.appCertificate
    this.roomUuid = options.roomUuid
    this.userUuid = options.userUuid
    this.role = options.role
    this.expire = options.expire
    this.issueTs = Math.floor(Date.now() / 1000)
    this.salt = Math.floor(Math.random() * 99999999) + 1
  }

  private packString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8')
    const lengthBuffer = Buffer.alloc(2)
    lengthBuffer.writeUInt16LE(strBuffer.length, 0)
    return Buffer.concat([lengthBuffer, strBuffer])
  }

  private packUint32(value: number): Buffer {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32LE(value, 0)
    return buffer
  }

  private packUint16(value: number): Buffer {
    const buffer = Buffer.alloc(2)
    buffer.writeUInt16LE(value, 0)
    return buffer
  }

  async build(): Promise<string> {
    try {
      // Validate inputs
      if (!this.appId || this.appId.length !== 32) {
        throw new Error(`Invalid appId: ${this.appId?.length || 0} characters`)
      }
      
      if (!this.appCertificate || this.appCertificate.length !== 32) {
        throw new Error(`Invalid appCertificate: ${this.appCertificate?.length || 0} characters`)
      }

      // Build signature
      const signature = await this.buildSignature()
      
      // Build message
      const message = this.buildMessage()
      
      // Create final signature
      const finalSignature = await encodeHMac(signature, message)
      const signatureString = Buffer.from(finalSignature).toString('hex')
      
      // Build content
      const content = Buffer.concat([
        this.packString(signatureString),
        message
      ])

      // Encode with version
      const token = EDUCATION_TOKEN_VERSION + content.toString('base64')
      
      console.log('[EDUCATION-TOKEN] Generated education token successfully:', {
        tokenLength: token.length,
        appId: this.appId.substring(0, 8) + '...',
        roomUuid: this.roomUuid,
        userUuid: this.userUuid,
        role: this.role
      })

      return token
    } catch (error) {
      console.error('[EDUCATION-TOKEN] Failed to build education token:', error)
      throw error
    }
  }

  private async buildSignature(): Promise<Uint8Array> {
    const issueBuffer = this.packUint32(this.issueTs)
    const saltBuffer = this.packUint32(this.salt)
    
    let signature = await encodeHMac(issueBuffer, this.appCertificate)
    signature = await encodeHMac(saltBuffer, signature)
    
    return signature
  }

  private buildMessage(): Buffer {
    // Build the message structure for education token
    const appIdBuffer = this.packString(this.appId)
    const issueTsBuffer = this.packUint32(this.issueTs)
    const expireBuffer = this.packUint32(this.expire)
    const saltBuffer = this.packUint32(this.salt)
    const roomUuidBuffer = this.packString(this.roomUuid)
    const userUuidBuffer = this.packString(this.userUuid)
    const roleBuffer = this.packUint16(this.role)
    
    // Service count (for education token, typically 1 service)
    const serviceCountBuffer = this.packUint16(1)
    
    // Service type for education (typically 4 for education service)
    const serviceTypeBuffer = this.packUint16(4)
    
    // Privileges (room user privilege)
    const privilegeCountBuffer = this.packUint16(1)
    const privilegeKeyBuffer = this.packUint16(EDUCATION_PRIVILEGES.ROOM_USER)
    const privilegeExpireBuffer = this.packUint32(this.expire)

    return Buffer.concat([
      appIdBuffer,
      issueTsBuffer,
      expireBuffer,
      saltBuffer,
      serviceCountBuffer,
      serviceTypeBuffer,
      roomUuidBuffer,
      userUuidBuffer,
      roleBuffer,
      privilegeCountBuffer,
      privilegeKeyBuffer,
      privilegeExpireBuffer
    ])
  }
}

export async function generateEducationToken(
  appId: string,
  appCertificate: string,
  roomUuid: string,
  userUuid: string,
  role: number,
  expireTimeInSeconds: number = 3600
): Promise<string> {
  console.log('[EDUCATION-TOKEN] Generating education token:', {
    appId: appId.substring(0, 8) + '...',
    roomUuid,
    userUuid,
    role,
    expireTimeInSeconds
  })

  const currentTime = Math.floor(Date.now() / 1000)
  const expireTime = currentTime + expireTimeInSeconds

  const builder = new EducationTokenBuilder({
    appId,
    appCertificate,
    roomUuid,
    userUuid,
    role,
    expire: expireTime
  })

  return await builder.build()
}

export { EDUCATION_ROLES }
