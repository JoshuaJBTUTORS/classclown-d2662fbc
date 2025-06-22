
import { Buffer } from 'https://deno.land/std@0.155.0/node/buffer.ts'
import { deflate, inflate } from 'https://deno.land/x/compress@v0.3.3/mod.ts'

const VERSION_LENGTH = 3
const APP_ID_LENGTH = 32

const getVersion = () => {
    return '007'
}

// HMAC encoding function using Deno's Web Crypto API
var encodeHMac = async function (key: any, message: any) {
    const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key
    const messageBuffer = typeof message === 'string' ? new TextEncoder().encode(message) : message
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer)
    return new Uint8Array(signature)
}

class Service {
    __type: number
    __privileges: { [key: number]: number }

    constructor(service_type: number) {
        this.__type = service_type
        this.__privileges = {}
    }

    __pack_type() {
        let buf = new ByteBuf()
        buf.putUint16(this.__type)
        return buf.pack()
    }

    __pack_privileges() {
        let buf = new ByteBuf()
        buf.putTreeMapUInt32(this.__privileges)
        return buf.pack()
    }

    service_type() {
        return this.__type
    }

    add_privilege(privilege: number, expire: number) {
        this.__privileges[privilege] = expire
    }

    pack() {
        return Buffer.concat([this.__pack_type(), this.__pack_privileges()])
    }

    unpack(buffer: Buffer) {
        let bufReader = new ReadByteBuf(buffer)
        this.__privileges = bufReader.getTreeMapUInt32()
        return bufReader
    }
}

const kRtcServiceType = 1

class ServiceRtc extends Service {
    __channel_name: string
    __uid: string

    constructor(channel_name: string, uid: number | string) {
        super(kRtcServiceType)
        this.__channel_name = channel_name
        this.__uid = uid === 0 ? '' : `${uid}`
    }

    pack() {
        let buffer = new ByteBuf()
        buffer.putString(this.__channel_name).putString(this.__uid)
        return Buffer.concat([super.pack(), buffer.pack()])
    }

    unpack(buffer: Buffer) {
        let bufReader = super.unpack(buffer)
        this.__channel_name = bufReader.getString()
        this.__uid = bufReader.getString()
        return bufReader
    }
}

ServiceRtc.kPrivilegeJoinChannel = 1
ServiceRtc.kPrivilegePublishAudioStream = 2
ServiceRtc.kPrivilegePublishVideoStream = 3
ServiceRtc.kPrivilegePublishDataStream = 4

const kRtmServiceType = 2

class ServiceRtm extends Service {
    __user_id: string

    constructor(user_id?: string) {
        super(kRtmServiceType)
        this.__user_id = user_id || ''
    }

    pack() {
        let buffer = new ByteBuf()
        buffer.putString(this.__user_id)
        return Buffer.concat([super.pack(), buffer.pack()])
    }

    unpack(buffer: Buffer) {
        let bufReader = super.unpack(buffer)
        this.__user_id = bufReader.getString()
        return bufReader
    }
}

ServiceRtm.kPrivilegeLogin = 1

const kChatServiceType = 5

class ServiceChat extends Service {
    __user_id: string

    constructor(user_id?: string) {
        super(kChatServiceType)
        this.__user_id = user_id || ''
    }

    pack() {
        let buffer = new ByteBuf()
        buffer.putString(this.__user_id)
        return Buffer.concat([super.pack(), buffer.pack()])
    }

    unpack(buffer: Buffer) {
        let bufReader = super.unpack(buffer)
        this.__user_id = bufReader.getString()
        return bufReader
    }
}

ServiceChat.kPrivilegeUser = 1
ServiceChat.kPrivilegeApp = 2

const kApaasServiceType = 7

class ServiceApaas extends Service {
    __room_uuid: string
    __user_uuid: string
    __role: number

    constructor(roomUuid?: string, userUuid?: string, role?: number) {
        super(kApaasServiceType)
        this.__room_uuid = roomUuid || ''
        this.__user_uuid = userUuid || ''
        this.__role = role || -1
    }

    pack() {
        let buffer = new ByteBuf()
        buffer.putString(this.__room_uuid)
        buffer.putString(this.__user_uuid)
        buffer.putInt16(this.__role)
        return Buffer.concat([super.pack(), buffer.pack()])
    }

    unpack(buffer: Buffer) {
        let bufReader = super.unpack(buffer)
        this.__room_uuid = bufReader.getString()
        this.__user_uuid = bufReader.getString()
        this.__role = bufReader.getInt16()
        return bufReader
    }
}

ServiceApaas.PRIVILEGE_ROOM_USER = 1
ServiceApaas.PRIVILEGE_USER = 2
ServiceApaas.PRIVILEGE_APP = 3

class AccessToken2 {
    appId: string
    appCertificate: string
    issueTs: number
    expire: number
    salt: number
    services: { [key: number]: Service }
    static kServices: { [key: number]: any }

    constructor(appId: string, appCertificate: string, issueTs?: number, expire?: number) {
        this.appId = appId
        this.appCertificate = appCertificate
        this.issueTs = issueTs || Math.floor(Date.now() / 1000)
        this.expire = expire || 0
        // salt ranges in (1, 99999999)
        this.salt = Math.floor(Math.random() * (99999999)) + 1
        this.services = {}
    }

    async __signing() {
        let signing = await encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), this.appCertificate)
        signing = await encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing)
        return signing
    }

    __build_check() {
        let is_uuid = (data: string) => {
            if (data.length !== APP_ID_LENGTH) {
                return false
            }
            try {
                let buf = Buffer.from(data, 'hex')
                return !!buf
            } catch {
                return false
            }
        }

        const { appId, appCertificate, services } = this
        if (!is_uuid(appId) || !is_uuid(appCertificate)) {
            return false
        }

        if (Object.keys(services).length === 0) {
            return false
        }
        return true
    }

    add_service(service: Service) {
        this.services[service.service_type()] = service
    }

    async build() {
        if (!this.__build_check()) {
            return ''
        }

        let signing = await this.__signing()
        let signing_info = new ByteBuf().putString(this.appId)
            .putUint32(this.issueTs)
            .putUint32(this.expire)
            .putUint32(this.salt)
            .putUint16(Object.keys(this.services).length).pack()
            
        Object.values(this.services).forEach((service) => {
            signing_info = Buffer.concat([signing_info, service.pack()])
        })

        let signature = await encodeHMac(signing, signing_info)
        let content = Buffer.concat([new ByteBuf().putString(Buffer.from(signature).toString('hex')).pack(), signing_info])
        let compressed = deflate(content)
        return `${getVersion()}${Buffer.from(compressed).toString('base64')}`
    }
}

var ByteBuf = function () {
    var that = {
        buffer: Buffer.alloc(1024),
        position: 0,
    }

    that.buffer.fill(0)

    that.pack = function () {
        var out = Buffer.alloc(that.position)
        that.buffer.copy(out, 0, 0, out.length)
        return out
    }

    that.putUint16 = function (v: number) {
        that.buffer.writeUInt16LE(v, that.position)
        that.position += 2
        return that
    }

    that.putUint32 = function (v: number) {
        that.buffer.writeUInt32LE(v, that.position)
        that.position += 4
        return that
    }

    that.putInt16 = function (v: number) {
        that.buffer.writeInt16LE(v, that.position)
        that.position += 2
        return that
    }

    that.putBytes = function (bytes: Buffer) {
        that.putUint16(bytes.length)
        bytes.copy(that.buffer, that.position)
        that.position += bytes.length
        return that
    }

    that.putString = function (str: string) {
        return that.putBytes(Buffer.from(str))
    }

    that.putTreeMapUInt32 = function (map: { [key: string]: number } | null) {
        if (!map) {
            that.putUint16(0)
            return that
        }

        that.putUint16(Object.keys(map).length)
        for (var key in map) {
            that.putUint16(parseInt(key))
            that.putUint32(map[key])
        }

        return that
    }

    return that
}

var ReadByteBuf = function (bytes: Buffer) {
    var that = {
        buffer: bytes,
        position: 0,
    }

    that.getUint16 = function () {
        var ret = that.buffer.readUInt16LE(that.position)
        that.position += 2
        return ret
    }

    that.getUint32 = function () {
        var ret = that.buffer.readUInt32LE(that.position)
        that.position += 4
        return ret
    }

    that.getInt16 = function () {
        var ret = that.buffer.readInt16LE(that.position)
        that.position += 2
        return ret
    }

    that.getString = function () {
        var len = that.getUint16()
        var out = Buffer.alloc(len)
        that.buffer.copy(out, 0, that.position, that.position + len)
        that.position += len
        return out.toString()
    }

    that.getTreeMapUInt32 = function () {
        var map: { [key: number]: number } = {}
        var len = that.getUint16()
        for (var i = 0; i < len; i++) {
            var key = that.getUint16()
            var value = that.getUint32()
            map[key] = value
        }
        return map
    }

    that.pack = function () {
        let length = that.buffer.length
        var out = Buffer.alloc(length)
        that.buffer.copy(out, 0, that.position, length)
        return out
    }

    return that
}

AccessToken2.kServices = {}
AccessToken2.kServices[kApaasServiceType] = ServiceApaas
AccessToken2.kServices[kChatServiceType] = ServiceChat
AccessToken2.kServices[kRtcServiceType] = ServiceRtc
AccessToken2.kServices[kRtmServiceType] = ServiceRtm

export {
    AccessToken2,
    kApaasServiceType,
    kChatServiceType,
    kRtcServiceType,
    kRtmServiceType,
    ServiceApaas,
    ServiceChat,
    ServiceRtc,
    ServiceRtm,
    encodeHMac
}
