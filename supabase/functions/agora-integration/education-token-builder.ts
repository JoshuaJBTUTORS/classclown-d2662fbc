
import { AccessToken2, ServiceApaas, ServiceChat, ServiceRtm } from './AccessToken2.ts'

// MD5 implementation for Deno
async function md5(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataArray = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('MD5', dataArray)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

class EducationTokenBuilder {
    /**
     * build user room token
     * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
     *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
     * @param appCertificate    Certificate of the application that you registered in
     *                          the Agora Dashboard. See Get an App Certificate.
     * @param roomUuid          The room's id, must be unique.
     * @param userUuid          The user's id, must be unique.
     * @param role              The user's role.
     * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
     *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
     * @return The user room token.
     */
    static async buildRoomUserToken(appId: string, appCertificate: string, roomUuid: string, userUuid: string, role: number, expire: number) {
        console.log('[EDUCATION-TOKEN] Building room user token with official implementation')
        console.log('  - appId:', appId.substring(0, 8) + '...')
        console.log('  - roomUuid:', roomUuid)
        console.log('  - userUuid:', userUuid)
        console.log('  - role:', role)
        console.log('  - expire:', expire)

        let accessToken = new AccessToken2(appId, appCertificate, 0, expire)

        let chatUserId = await md5(userUuid)
        console.log('  - chatUserId (MD5):', chatUserId.substring(0, 8) + '...')

        let apaasService = new ServiceApaas(roomUuid, userUuid, role)
        accessToken.add_service(apaasService)

        let rtmService = new ServiceRtm(userUuid)
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire)
        accessToken.add_service(rtmService)

        let chatService = new ServiceChat(chatUserId)
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire)
        accessToken.add_service(chatService)

        const token = await accessToken.build()
        console.log('[EDUCATION-TOKEN] ✓ Official token built successfully')
        console.log('  - Token length:', token.length)
        console.log('  - Token preview:', token.substring(0, 20) + '...')
        console.log('  - Starts with version "007":', token.startsWith('007'))

        return token
    }

    /**
     * build user token
     * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
     *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
     * @param appCertificate    Certificate of the application that you registered in
     *                          the Agora Dashboard. See Get an App Certificate.
     * @param userUuid          The user's id, must be unique.
     * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
     *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
     * @return The user token.
     */
    static async buildUserToken(appId: string, appCertificate: string, userUuid: string, expire: number) {
        let accessToken = new AccessToken2(appId, appCertificate, 0, expire)
        let apaasService = new ServiceApaas('', userUuid)
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire)
        accessToken.add_service(apaasService)

        return await accessToken.build()
    }

    /**
     * build app token
     * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
     *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
     * @param appCertificate Certificate of the application that you registered in
     *                       the Agora Dashboard. See Get an App Certificate.
     * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
     *                       Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
     * @return The app token.
     */
    static async buildAppToken(appId: string, appCertificate: string, expire: number) {
        let accessToken = new AccessToken2(appId, appCertificate, 0, expire)
        let apaasService = new ServiceApaas()
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire)
        accessToken.add_service(apaasService)

        return await accessToken.build()
    }
}

export { EducationTokenBuilder }
