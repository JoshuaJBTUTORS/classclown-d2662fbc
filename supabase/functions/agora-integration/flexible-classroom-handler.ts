
// Room creation handler for Agora Flexible Classroom
export async function handleFlexibleClassroom(params: any) {
  console.log('[FLEXIBLE-CLASSROOM] Creating room with params:', params)
  
  const { 
    roomName, 
    roomType = 4, // Default to small class (1v1: 0, small class: 4, lecture: 2)
    maxUsers = 200,
    startTime,
    endTime 
  } = params
  
  if (!roomName) {
    throw new Error('Missing required parameter: roomName')
  }

  // Get credentials from environment
  const appId = Deno.env.get('AGORA_APP_ID')
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
  
  if (!appId || !appCertificate) {
    throw new Error('Missing Agora credentials in environment variables')
  }

  try {
    // Create Basic Auth header
    const credentials = btoa(`${appId}:${appCertificate}`)
    
    // Prepare room creation payload
    const roomPayload = {
      roomName: roomName,
      roomType: roomType,
      roomProperties: {
        schedule: {
          startTime: startTime || Math.floor(Date.now() / 1000),
          duration: endTime ? Math.floor((new Date(endTime).getTime() - new Date(startTime || Date.now()).getTime()) / 1000) : 3600,
          closeDelay: 300
        },
        processes: {
          handsUp: {
            maxAccept: 1
          }
        }
      }
    }

    console.log('[FLEXIBLE-CLASSROOM] Making room creation request to Agora API')
    
    // Make API call to create room
    const response = await fetch(`https://api.agora.io/edu/apps/${appId}/v2/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'x-agora-token': '', // Empty for room creation
        'x-agora-uid': '0'   // System user for room creation
      },
      body: JSON.stringify(roomPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[FLEXIBLE-CLASSROOM] Room creation failed:', response.status, errorText)
      throw new Error(`Room creation failed: ${response.status} - ${errorText}`)
    }

    const roomData = await response.json()
    console.log('[FLEXIBLE-CLASSROOM] Room created successfully:', roomData)

    return {
      success: true,
      roomUuid: roomData.data?.roomUuid || `room_${Date.now()}`,
      roomName: roomName,
      roomType: roomType,
      maxUsers: maxUsers,
      appId: appId,
      createdAt: new Date().toISOString(),
      roomData: roomData.data
    }

  } catch (error: any) {
    console.error('[FLEXIBLE-CLASSROOM] Room creation error:', error)
    throw new Error(`Room creation failed: ${error.message}`)
  }
}
