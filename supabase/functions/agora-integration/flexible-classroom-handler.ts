
// Room creation handler for Agora Flexible Classroom with extensive debugging
export async function handleFlexibleClassroom(params: any) {
  console.log('=== AGORA FLEXIBLE CLASSROOM DEBUG START ===')
  console.log('[FLEXIBLE-CLASSROOM] Input parameters received:', JSON.stringify(params, null, 2))
  
  const { 
    roomName, 
    roomType = 4, // Default to small class (1v1: 0, small class: 4, lecture: 2)
    maxUsers = 200,
    startTime,
    endTime 
  } = params
  
  // Debug parameter validation
  console.log('[FLEXIBLE-CLASSROOM] Parameter validation:')
  console.log('  - roomName:', roomName ? `"${roomName}" (length: ${roomName.length})` : 'MISSING')
  console.log('  - roomType:', roomType, '(valid values: 0=1v1, 2=lecture, 4=small class)')
  console.log('  - maxUsers:', maxUsers)
  console.log('  - startTime:', startTime ? `"${startTime}"` : 'NOT PROVIDED')
  console.log('  - endTime:', endTime ? `"${endTime}"` : 'NOT PROVIDED')
  
  if (!roomName) {
    console.error('[FLEXIBLE-CLASSROOM] ERROR: Missing required parameter: roomName')
    throw new Error('Missing required parameter: roomName')
  }

  // Debug environment variable validation
  console.log('[FLEXIBLE-CLASSROOM] Environment variables check:')
  const appId = Deno.env.get('AGORA_APP_ID')
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
  
  console.log('  - AGORA_APP_ID:', appId ? 
    `Present (length: ${appId.length}, starts with: ${appId.substring(0, 4)}...)` : 
    'MISSING OR EMPTY')
  console.log('  - AGORA_APP_CERTIFICATE:', appCertificate ? 
    `Present (length: ${appCertificate.length}, starts with: ${appCertificate.substring(0, 4)}...)` : 
    'MISSING OR EMPTY')
  
  if (!appId || !appCertificate) {
    console.error('[FLEXIBLE-CLASSROOM] ERROR: Missing Agora credentials')
    console.error('  - AGORA_APP_ID missing:', !appId)
    console.error('  - AGORA_APP_CERTIFICATE missing:', !appCertificate)
    throw new Error('Missing Agora credentials in environment variables')
  }

  // Validate credential format
  if (appId.length !== 32) {
    console.error('[FLEXIBLE-CLASSROOM] ERROR: Invalid AGORA_APP_ID format (should be 32 characters)')
    throw new Error('Invalid AGORA_APP_ID format')
  }
  
  if (appCertificate.length !== 32) {
    console.error('[FLEXIBLE-CLASSROOM] ERROR: Invalid AGORA_APP_CERTIFICATE format (should be 32 characters)')
    throw new Error('Invalid AGORA_APP_CERTIFICATE format')
  }

  try {
    // Debug time calculations
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const startTimestamp = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : currentTimestamp
    const endTimestamp = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : (startTimestamp + 3600)
    const duration = endTimestamp - startTimestamp
    
    console.log('[FLEXIBLE-CLASSROOM] Time calculations:')
    console.log('  - Current timestamp:', currentTimestamp, `(${new Date(currentTimestamp * 1000).toISOString()})`)
    console.log('  - Start timestamp:', startTimestamp, `(${new Date(startTimestamp * 1000).toISOString()})`)
    console.log('  - End timestamp:', endTimestamp, `(${new Date(endTimestamp * 1000).toISOString()})`)
    console.log('  - Duration (seconds):', duration, `(${Math.round(duration / 60)} minutes)`)
    
    if (duration <= 0) {
      console.error('[FLEXIBLE-CLASSROOM] ERROR: Invalid duration (end time must be after start time)')
      throw new Error('Invalid duration: end time must be after start time')
    }

    // Debug Basic Auth creation
    console.log('[FLEXIBLE-CLASSROOM] Authentication setup:')
    const credentials = btoa(`${appId}:${appCertificate}`)
    console.log('  - Credentials format: appId:appCertificate')
    console.log('  - Base64 encoded length:', credentials.length)
    console.log('  - Auth header preview:', `Basic ${credentials.substring(0, 20)}...`)
    
    // Debug room payload preparation
    const roomPayload = {
      roomName: roomName,
      roomType: roomType,
      roomProperties: {
        schedule: {
          startTime: startTimestamp,
          duration: duration,
          closeDelay: 300
        },
        processes: {
          handsUp: {
            maxAccept: 1
          }
        }
      }
    }

    console.log('[FLEXIBLE-CLASSROOM] Room payload prepared:')
    console.log(JSON.stringify(roomPayload, null, 2))

    // Debug API endpoint
    const apiUrl = `https://api.agora.io/edu/apps/${appId}/v2/rooms`
    console.log('[FLEXIBLE-CLASSROOM] API call details:')
    console.log('  - Endpoint URL:', apiUrl)
    console.log('  - Method: POST')
    console.log('  - Content-Type: application/json')
    
    // Debug request headers
    const requestHeaders = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'x-agora-token': '', // Empty for room creation
      'x-agora-uid': '0'   // System user for room creation
    }
    
    console.log('  - Request headers:')
    console.log('    * Authorization: Basic [MASKED]')
    console.log('    * Content-Type:', requestHeaders['Content-Type'])
    console.log('    * x-agora-token:', requestHeaders['x-agora-token'])
    console.log('    * x-agora-uid:', requestHeaders['x-agora-uid'])

    console.log('[FLEXIBLE-CLASSROOM] Making API request to Agora...')
    const requestStartTime = Date.now()
    
    // Make API call to create room
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(roomPayload)
    })

    const requestDuration = Date.now() - requestStartTime
    console.log(`[FLEXIBLE-CLASSROOM] API request completed in ${requestDuration}ms`)

    // Debug response details
    console.log('[FLEXIBLE-CLASSROOM] Response details:')
    console.log('  - Status:', response.status)
    console.log('  - Status text:', response.statusText)
    console.log('  - Headers:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`    * ${key}: ${value}`)
    }

    // Get response text for debugging
    const responseText = await response.text()
    console.log('  - Response body (raw):', responseText)
    console.log('  - Response body length:', responseText.length)

    if (!response.ok) {
      console.error('[FLEXIBLE-CLASSROOM] API request failed!')
      console.error('  - Status:', response.status)
      console.error('  - Status text:', response.statusText)
      console.error('  - Response body:', responseText)
      
      // Try to parse error response
      let errorDetails = 'Unknown error'
      try {
        const errorJson = JSON.parse(responseText)
        console.error('  - Parsed error JSON:', JSON.stringify(errorJson, null, 2))
        errorDetails = JSON.stringify(errorJson)
      } catch (parseError) {
        console.error('  - Could not parse error response as JSON:', parseError.message)
        errorDetails = responseText || 'Empty response body'
      }
      
      throw new Error(`Room creation failed: ${response.status} - ${errorDetails}`)
    }

    // Parse successful response
    let roomData
    try {
      roomData = JSON.parse(responseText)
      console.log('[FLEXIBLE-CLASSROOM] Parsed response JSON:', JSON.stringify(roomData, null, 2))
    } catch (parseError) {
      console.error('[FLEXIBLE-CLASSROOM] ERROR: Could not parse successful response as JSON')
      console.error('  - Parse error:', parseError.message)
      console.error('  - Response text:', responseText)
      throw new Error(`Invalid JSON response: ${parseError.message}`)
    }

    // Debug successful response structure
    console.log('[FLEXIBLE-CLASSROOM] Response analysis:')
    console.log('  - Response has data property:', 'data' in roomData)
    console.log('  - Response data type:', typeof roomData.data)
    if (roomData.data) {
      console.log('  - Room UUID from response:', roomData.data.roomUuid || 'NOT FOUND')
      console.log('  - Response data keys:', Object.keys(roomData.data))
    }

    const result = {
      success: true,
      roomUuid: roomData.data?.roomUuid || `room_${Date.now()}`,
      roomName: roomName,
      roomType: roomType,
      maxUsers: maxUsers,
      appId: appId,
      createdAt: new Date().toISOString(),
      roomData: roomData.data,
      debug: {
        requestDuration: requestDuration,
        responseStatus: response.status,
        responseSize: responseText.length,
        timestamp: new Date().toISOString()
      }
    }

    console.log('[FLEXIBLE-CLASSROOM] SUCCESS! Room created successfully')
    console.log('  - Final result:', JSON.stringify(result, null, 2))
    console.log('=== AGORA FLEXIBLE CLASSROOM DEBUG END ===')

    return result

  } catch (error: any) {
    console.error('=== AGORA FLEXIBLE CLASSROOM ERROR DEBUG ===')
    console.error('[FLEXIBLE-CLASSROOM] Caught error:', error)
    console.error('  - Error type:', typeof error)
    console.error('  - Error name:', error.name)
    console.error('  - Error message:', error.message)
    console.error('  - Error stack:', error.stack)
    
    if (error.cause) {
      console.error('  - Error cause:', error.cause)
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('  - This appears to be a network/fetch error')
      console.error('  - Possible causes: DNS resolution, network connectivity, CORS, SSL issues')
    }
    
    console.error('=== AGORA FLEXIBLE CLASSROOM ERROR DEBUG END ===')
    throw new Error(`Room creation failed: ${error.message}`)
  }
}
