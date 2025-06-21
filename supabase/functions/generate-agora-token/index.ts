
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'
import { Buffer } from 'https://deno.land/std@0.155.0/node/buffer.ts'
import { deflate, inflate } from 'https://deno.land/x/compress@v0.3.3/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION_LENGTH = 3
const APP_ID_LENGTH = 32

const getVersion = () => {
    return '007'
}

class Service {
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
    private __channel_name: string
    private __uid: string

    constructor(channel_name: string, uid: number) {
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
    private __user_id: string

    constructor(user_id: string) {
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

class AccessToken2 {
    appId: string
    appCertificate: string
    issueTs: number
    expire: number
    salt: number
    services: any

    constructor(appId: string, appCertificate: string, issueTs?: number, expire?: number) {
        this.appId = appId
        this.appCertificate = appCertificate
        this.issueTs = issueTs || Math.floor(new Date().getTime() / 1000)
        this.expire = expire || 0
        this.salt = Math.floor(Math.random() * (99999999)) + 1
        this.services = {}
    }

    __signing() {
        let signing = encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), this.appCertificate)
        signing = encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing)
        return signing
    }

    __build_check() {
        let is_uuid = (data: string) => {
            if (data.length !== APP_ID_LENGTH) {
                return false
            }
            let buf = Buffer.from(data, 'hex')
            return !!buf
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

    build() {
        if (!this.__build_check()) {
            return ''
        }

        let signing = this.__signing()
        let signing_info = new ByteBuf().putString(this.appId)
            .putUint32(this.issueTs)
            .putUint32(this.expire)
            .putUint32(this.salt)
            .putUint16(Object.keys(this.services).length).pack()
        
        Object.values(this.services).forEach((service: any) => {
            signing_info = Buffer.concat([signing_info, service.pack()])
        })

        let signature = encodeHMac(signing, signing_info)
        let content = Buffer.concat([new ByteBuf().putString(signature).pack(), signing_info])
        let compressed = deflate(content)
        return `${getVersion()}${Buffer.from(compressed).toString('base64')}`
    }
}

var encodeHMac = function (key: any, message: any) {
    return hmac('sha256', key, message, 'utf8')
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

    that.putBytes = function (bytes: Buffer) {
        that.putUint16(bytes.length)
        bytes.copy(that.buffer, that.position)
        that.position += bytes.length
        return that
    }

    that.putString = function (str: string) {
        return that.putBytes(Buffer.from(str))
    }

    that.putTreeMapUInt32 = function (map: any) {
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

    that.getString = function () {
        var len = that.getUint16()
        var out = Buffer.alloc(len)
        that.buffer.copy(out, 0, that.position, that.position + len)
        that.position += len
        return out.toString()
    }

    that.getTreeMapUInt32 = function () {
        var map: any = {}
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

// Helper function to generate RTC token
function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: string, expireTime: number) {
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtc = new ServiceRtc(channelName, uid)
    
    // Add privileges based on role
    if (role === 'publisher' || role === 'tutor') {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, expireTime)
    } else {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
    }
    
    token.add_service(serviceRtc)
    return token.build()
}

// Helper function to generate RTM token
function generateRtmToken(appId: string, appCertificate: string, userId: string, expireTime: number) {
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtm = new ServiceRtm(userId)
    serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expireTime)
    token.add_service(serviceRtm)
    return token.build()
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { channelName, uid, userRole, expireTime: customExpireTime } = await req.json()

        // Get Agora credentials from environment
        const appId = Deno.env.get('AGORA_APP_ID')
        const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')

        if (!appId || !appCertificate) {
            console.error('[AGORA-TOKEN] Missing Agora credentials')
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Agora credentials not configured' 
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!channelName || uid === undefined) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Missing required parameters: channelName, uid' 
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Set token expiration (24 hours by default)
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const expireTime = customExpireTime || (currentTimestamp + 86400) // 24 hours

        console.log('[AGORA-TOKEN] Generating tokens:', {
            channelName,
            uid,
            userRole,
            expireTime: new Date(expireTime * 1000).toISOString()
        })

        // Generate RTC token
        const rtcToken = generateRtcToken(appId, appCertificate, channelName, uid, userRole, expireTime)
        
        // Generate RTM token
        const rtmToken = generateRtmToken(appId, appCertificate, uid.toString(), expireTime)

        if (!rtcToken || !rtmToken) {
            console.error('[AGORA-TOKEN] Failed to generate tokens')
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Failed to generate tokens' 
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('[AGORA-TOKEN] Tokens generated successfully')

        return new Response(
            JSON.stringify({
                success: true,
                rtcToken,
                rtmToken,
                channelName,
                uid,
                appId,
                expireTime,
                role: userRole === 'tutor' ? 'publisher' : 'subscriber'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[AGORA-TOKEN] Error:', error)
        return new Response(
            JSON.stringify({ 
                success: false, 
                error: error.message || 'Internal server error' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
