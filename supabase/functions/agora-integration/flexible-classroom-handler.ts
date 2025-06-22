
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { EducationTokenBuilder } from './education-token-builder.ts'

// Room creation handler for Agora Flexible Classroom with comprehensive debugging
export async function handleFlexibleClassroom(params: any) {
  console.log('=== AGORA FLEXIBLE CLASSROOM DEBUG START ===')
  console.log('[STEP 1] Input parameters received:', JSON.stringify(params, null, 2))
  
  try {
    const { 
      lessonId,
      userId,
      userRole
    } = params
    
    // Debug parameter validation
    console.log('[STEP 1] Parameter validation:')
    console.log('  - lessonId:', lessonId ? `"${lessonId}"` : 'MISSING')
    console.log('  - userId:', userId ? `"${userId}"` : 'MISSING')
    console.log('  - userRole:', userRole ? `"${userRole}"` : 'MISSING')
    
    if (!lessonId || !userId || !userRole) {
      console.error('[STEP 1] ERROR: Missing required parameters')
      throw new Error('Missing required parameters: lessonId, userId, userRole')
    }

    console.log('[STEP 1] ✓ Parameters validated successfully')

    // Initialize Supabase client
    console.log('[STEP 2] Initializing Supabase client...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('[STEP 2] ✓ Supabase client initialized')

    // Fetch lesson details
    console.log('[STEP 3] Fetching lesson details for:', lessonId)
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('title, start_time, end_time, is_group')
      .eq('id', lessonId)
      .maybeSingle()

    if (lessonError) {
      console.error('[STEP 3] ERROR: Supabase query failed:', lessonError)
      throw new Error(`Failed to fetch lesson details: ${lessonError.message}`)
    }

    if (!lesson) {
      console.error('[STEP 3] ERROR: Lesson not found')
      throw new Error('Lesson not found')
    }

    console.log('[STEP 3] ✓ Lesson details fetched:', JSON.stringify(lesson, null, 2))

    // Generate room parameters from lesson data
    console.log('[STEP 4] Generating room parameters...')
    const roomName = `${lesson.title}_${lessonId.substring(0, 8)}`
    const roomUuid = lessonId // Use lesson ID as room UUID
    const roomType = lesson.is_group ? 4 : 0 // 0 for 1v1, 4 for small class
    const maxUsers = lesson.is_group ? 200 : 2
    const startTime = lesson.start_time
    const endTime = lesson.end_time

    console.log('[STEP 4] ✓ Room parameters generated:')
    console.log('  - roomName:', roomName)
    console.log('  - roomUuid:', roomUuid)
    console.log('  - roomType:', roomType)  
    console.log('  - maxUsers:', maxUsers)
    console.log('  - startTime:', startTime)
    console.log('  - endTime:', endTime)

    // Debug environment variable validation
    console.log('[STEP 5] Validating environment variables...')
    const appId = Deno.env.get('AGORA_APP_ID')
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
    
    console.log('[STEP 5] Environment variables check:')
    console.log('  - AGORA_APP_ID:', appId ? 
      `Present (length: ${appId.length}, starts with: ${appId.substring(0, 4)}...)` : 
      'MISSING OR EMPTY')
    console.log('  - AGORA_APP_CERTIFICATE:', appCertificate ? 
      `Present (length: ${appCertificate.length}, starts with: ${appCertificate.substring(0, 4)}...)` : 
      'MISSING OR EMPTY')
    
    if (!appId || !appCertificate) {
      console.error('[STEP 5] ERROR: Missing Agora credentials')
      throw new Error('Missing Agora credentials in environment variables')
    }

    // Validate credential format
    if (appId.length !== 32) {
      console.error('[STEP 5] ERROR: Invalid AGORA_APP_ID format')
      throw new Error('Invalid AGORA_APP_ID format (should be 32 characters)')
    }
    
    if (appCertificate.length !== 32) {
      console.error('[STEP 5] ERROR: Invalid AGORA_APP_CERTIFICATE format')
      throw new Error('Invalid AGORA_APP_CERTIFICATE format (should be 32 characters)')
    }

    console.log('[STEP 5] ✓ Environment variables validated')

    // Debug time calculations
    console.log('[STEP 6] Calculating time parameters...')
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const startTimestamp = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : currentTimestamp
    const endTimestamp = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : (startTimestamp + 3600)
    const duration = endTimestamp - startTimestamp
    
    console.log('[STEP 6] Time calculations:')
    console.log('  - Current timestamp:', currentTimestamp, `(${new Date(currentTimestamp * 1000).toISOString()})`)
    console.log('  - Start timestamp:', startTimestamp, `(${new Date(startTimestamp * 1000).toISOString()})`)
    console.log('  - End timestamp:', endTimestamp, `(${new Date(endTimestamp * 1000).toISOString()})`)
    console.log('  - Duration (seconds):', duration, `(${Math.round(duration / 60)} minutes)`)
    
    if (duration <= 0) {
      console.error('[STEP 6] ERROR: Invalid duration')
      throw new Error('Invalid duration: end time must be after start time')
    }

    console.log('[STEP 6] ✓ Time parameters calculated')

    // STEP 7: Use HARD CODED TOKEN for testing
    console.log('[STEP 7] === USING HARD CODED TOKEN FOR TESTING ===')
    
    // Hard coded token from Agora official token generator
    const educationToken = '007eJxSYLjPEsNpszg8W/P2b9u8iVx7P1oJbRLiMvaaMtfVn3PeS1cFBiNLUwPDZLMkU4NkAxNzi0QL4ySTZIM0A2OzVEMjM3MDG5eIjIZARoa7T60YGBmYGBgZGBlAfAYGQAAAAP//pC4aIw=='
    
    console.log('[STEP 7] Hard coded token details:')
    console.log('  - Token length:', educationToken.length)
    console.log('  - Token preview:', educationToken.substring(0, 20) + '...')
    console.log('  - Starts with version "007":', educationToken.startsWith('007'))
    console.log('  - Token type: HARD CODED FROM AGORA OFFICIAL GENERATOR')

    console.log('[STEP 7] === HARD CODED TOKEN LOADED ===')

    // STEP 8: Prepare room payload
    console.log('[STEP 8] Preparing room payload...')
    const roomPayload = {
      roomName: roomName,
      roomType: roomType,
      roomProperties: {
        schedule: {
          startTime: startTimestamp * 1000, // API expects milliseconds
          duration: duration,
          closeDelay: 300
        },
        processes: {
          handsUp: {
            maxAccept: lesson.is_group ? 10 : 1
          }
        }
      }
    }

    console.log('[STEP 8] ✓ Room payload prepared:', JSON.stringify(roomPayload, null, 2))

    // STEP 9: Prepare API call with CORRECT authentication
    const region = 'na' // Default to North America, could be made configurable
    const apiUrl = `https://api.agora.io/${region}/edu/apps/${appId}/v2/rooms/${roomUuid}`
    console.log('[STEP 9] Preparing API call to:', apiUrl)
    
    // FIXED: Use correct authentication format as per API documentation
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `agora token=${educationToken}` // CORRECT FORMAT per API docs
    }

    console.log('[STEP 9] ✓ API call prepared with HARD CODED TOKEN authentication')
    console.log('[STEP 9] Authorization header:', `agora token=${educationToken.substring(0, 20)}...`)

    console.log('[STEP 10] Making API request to Agora...')
    const requestStartTime = Date.now()
    
    // Make API call to create room
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(roomPayload)
    })

    const requestDuration = Date.now() - requestStartTime
    console.log(`[STEP 10] ✓ API request completed in ${requestDuration}ms`)

    // Debug response details
    console.log('[STEP 11] Processing API response...')
    console.log('  - Status:', response.status)
    console.log('  - Status text:', response.statusText)

    // Get response text for debugging
    const responseText = await response.text()
    console.log('  - Response body length:', responseText.length)

    if (!response.ok) {
      console.error('[STEP 11] ERROR: API request failed!')
      console.error('  - Status:', response.status)
      console.error('  - Response body:', responseText)
      
      let errorDetails = 'Unknown error'
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = JSON.stringify(errorJson)
      } catch (parseError) {
        errorDetails = responseText || 'Empty response body'
      }
      
      throw new Error(`Room creation failed: ${response.status} - ${errorDetails}`)
    }

    // Parse successful response
    console.log('[STEP 11] ✓ API response successful')
    let roomData
    try {
      roomData = JSON.parse(responseText)
      console.log('[STEP 11] ✓ Response parsed successfully')
    } catch (parseError) {
      console.error('[STEP 11] ERROR: Could not parse response as JSON')
      throw new Error(`Invalid JSON response: ${parseError.message}`)
    }

    // STEP 12: Prepare final result
    console.log('[STEP 12] Preparing final result...')
    const result = {
      success: true,
      roomUuid: roomUuid,
      roomName: roomName,
      roomType: roomType,
      maxUsers: maxUsers,
      appId: appId,
      educationToken: educationToken,
      userUuid: userId,
      userRole: userRole,
      createdAt: new Date().toISOString(),
      roomData: roomData,
      lessonId: lessonId,
      userId: userId,
      tokenDetails: {
        tokenLength: educationToken.length,
        tokenPreview: educationToken.substring(0, 20) + '...',
        generatedAt: new Date().toISOString(),
        tokenType: 'HARD_CODED_FROM_AGORA_OFFICIAL_GENERATOR',
        validationChecks: {
          startsWithVersion: educationToken.startsWith('007'),
          lengthValid: educationToken.length > 50,
          isBase64Format: /^[A-Za-z0-9+/]+=*$/.test(educationToken.substring(3))
        }
      },
      debug: {
        requestDuration: requestDuration,
        responseStatus: response.status,
        responseSize: responseText.length,
        timestamp: new Date().toISOString(),
        authMethod: 'agora_token_header_HARD_CODED'
      }
    }

    console.log('[STEP 12] ✓ Final result prepared')
    console.log('[SUCCESS] Room created successfully with HARD CODED TOKEN!')
    console.log('  - Room UUID:', result.roomUuid)
    console.log('  - Education token length:', result.educationToken.length)
    console.log('  - Token preview:', result.educationToken.substring(0, 20) + '...')
    console.log('  - Authentication method: agora token= header with HARD CODED TOKEN')
    console.log('=== AGORA FLEXIBLE CLASSROOM DEBUG END ===')

    return result

  } catch (error: any) {
    console.error('=== AGORA FLEXIBLE CLASSROOM ERROR DEBUG ===')
    console.error('[ERROR] Caught error at top level:', error)
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
    }
    
    console.error('=== AGORA FLEXIBLE CLASSROOM ERROR DEBUG END ===')
    
    // Re-throw with more context
    throw new Error(`Room creation failed at processing step: ${error.message}`)
  }
}
