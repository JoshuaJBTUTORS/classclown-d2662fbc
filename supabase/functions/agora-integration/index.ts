
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleFlexibleClassroom } from './flexible-classroom-handler.ts'

// Define CORS headers directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== AGORA INTEGRATION REQUEST DEBUG START ===')
  console.log('[REQUEST] Incoming request details:')
  console.log('  - Method:', req.method)
  console.log('  - URL:', req.url)
  console.log('  - Timestamp:', new Date().toISOString())

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[REQUEST] Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.error('[REQUEST] ERROR: Invalid method:', req.method)
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed', 
        receivedMethod: req.method,
        expectedMethod: 'POST'
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Debug request body parsing
    console.log('[REQUEST] Parsing request body...')
    const requestText = await req.text()
    console.log('  - Request body length:', requestText.length)
    
    if (!requestText || requestText.trim() === '') {
      console.error('[REQUEST] ERROR: Empty request body')
      throw new Error('Request body is empty')
    }
    
    let requestBody
    try {
      requestBody = JSON.parse(requestText)
      console.log('  - ✓ Request body parsed successfully')
      console.log('  - Action:', requestBody.action)
    } catch (parseError) {
      console.error('[REQUEST] ERROR: Invalid JSON in request body')
      console.error('  - Parse error:', parseError.message)
      console.error('  - Request text preview:', requestText.substring(0, 100) + '...')
      throw new Error(`Invalid JSON: ${parseError.message}`)
    }

    const { action, ...params } = requestBody
    console.log('[REQUEST] ✓ Request validated')
    console.log('  - Action:', action)
    console.log('  - Parameters keys:', Object.keys(params))

    let result
    const actionStartTime = Date.now()

    console.log('[PROCESSING] Starting action processing...')
    
    switch (action) {
      case 'generate-education-token':
        console.log('[PROCESSING] Handling generate-education-token action')
        result = await handleGenerateEducationToken(params)
        break
      
      case 'create-room':
      case 'flexible-classroom':
        console.log('[PROCESSING] Handling room creation action')
        result = await handleCreateRoom(params)
        break
      
      default:
        console.error('[PROCESSING] ERROR: Unknown action:', action)
        throw new Error(`Unknown action: ${action}. Supported actions: generate-education-token, create-room, flexible-classroom`)
    }

    const actionDuration = Date.now() - actionStartTime
    console.log(`[PROCESSING] ✓ Action completed successfully in ${actionDuration}ms`)
    console.log('[SUCCESS] Returning successful response')
    console.log('=== AGORA INTEGRATION REQUEST DEBUG END ===')

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('=== AGORA INTEGRATION ERROR DEBUG ===')
    console.error('[ERROR] Top-level error caught:', error)
    console.error('  - Error type:', typeof error)
    console.error('  - Error name:', error.name)
    console.error('  - Error message:', error.message)
    console.error('  - Error stack:', error.stack)
    
    if (error.cause) {
      console.error('  - Error cause:', error.cause)
    }
    
    // Provide more specific error context
    let errorContext = 'Unknown error location'
    if (error.message.includes('JSON')) {
      errorContext = 'Request body parsing'
    } else if (error.message.includes('Room creation')) {
      errorContext = 'Room creation process'
    } else if (error.message.includes('Token generation')) {
      errorContext = 'Token generation process'
    }
    
    console.error('  - Error context:', errorContext)
    console.error('=== AGORA INTEGRATION ERROR DEBUG END ===')

    const errorResponse = {
      error: error.message || 'Internal server error',
      details: error.toString(),
      context: errorContext,
      timestamp: new Date().toISOString(),
      debug: {
        errorType: typeof error,
        errorName: error.name,
        hasStack: !!error.stack,
        hasCause: !!error.cause
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleCreateRoom(params: any) {
  console.log('[ROOM-CREATION] Starting room creation process')
  console.log('  - Input params keys:', Object.keys(params))
  
  try {
    const roomResult = await handleFlexibleClassroom(params)
    console.log('[ROOM-CREATION] ✓ Room creation successful')
    return roomResult
  } catch (error: any) {
    console.error('[ROOM-CREATION] ERROR: Room creation failed:', error)
    console.error('  - Will re-throw error for main handler')
    throw new Error(`Room creation failed: ${error.message}`)
  }
}

async function handleGenerateEducationToken(params: any) {
  console.log('[TOKEN-GENERATION] Starting token generation process')
  console.log('  - Input params:', Object.keys(params))
  
  const { roomUuid, userUuid, userRole, expireTimeInSeconds = 86400 } = params
  
  if (!roomUuid || !userUuid || !userRole) {
    console.error('[TOKEN-GENERATION] ERROR: Missing required token parameters')
    throw new Error('Missing required parameters: roomUuid, userUuid, userRole')
  }

  // Get credentials from environment
  const appId = Deno.env.get('AGORA_APP_ID')
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
  
  if (!appId || !appCertificate) {
    console.error('[TOKEN-GENERATION] ERROR: Missing Agora credentials')
    throw new Error('Missing Agora credentials in environment variables')
  }

  // Map user role to education role number
  let roleNumber: number
  switch (userRole.toLowerCase()) {
    case 'teacher':
    case 'tutor':
      roleNumber = 1 // TEACHER
      break
    case 'student':
      roleNumber = 2 // STUDENT
      break
    case 'assistant':
      roleNumber = 3 // ASSISTANT
      break
    case 'observer':
      roleNumber = 4 // OBSERVER
      break
    default:
      roleNumber = 2 // Default to student
      break
  }

  console.log('[TOKEN-GENERATION] ✓ Role mapped successfully')

  // For now, create a simple token placeholder
  const educationToken = `temp_token_${Date.now()}_${roleNumber}`

  console.log('[TOKEN-GENERATION] ✓ Token generated successfully')

  return {
    success: true,
    educationToken,
    appId,
    roomUuid,
    userUuid,
    userRole,
    roleNumber,
    expiresIn: expireTimeInSeconds,
    debug: {
      tokenLength: educationToken.length,
      generatedAt: new Date().toISOString()
    }
  }
}
