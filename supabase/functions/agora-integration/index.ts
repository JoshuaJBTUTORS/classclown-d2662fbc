
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleFlexibleClassroom } from './flexible-classroom-handler.ts'
import { generateEducationToken, EDUCATION_ROLES } from './education-token-builder.ts'

// Define CORS headers directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== AGORA INTEGRATION REQUEST DEBUG START ===')
  console.log('[AGORA-INTEGRATION] Incoming request details:')
  console.log('  - Method:', req.method)
  console.log('  - URL:', req.url)
  console.log('  - Headers:')
  for (const [key, value] of req.headers.entries()) {
    // Mask authorization header for security
    const displayValue = key.toLowerCase() === 'authorization' ? '[MASKED]' : value
    console.log(`    * ${key}: ${displayValue}`)
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[AGORA-INTEGRATION] Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.error('[AGORA-INTEGRATION] ERROR: Invalid method:', req.method)
    return new Response(
      JSON.stringify({ error: 'Method not allowed', receivedMethod: req.method }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Debug request body parsing
    console.log('[AGORA-INTEGRATION] Parsing request body...')
    const requestText = await req.text()
    console.log('  - Request body (raw):', requestText)
    console.log('  - Request body length:', requestText.length)
    
    let requestBody
    try {
      requestBody = JSON.parse(requestText)
      console.log('  - Parsed request body:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('[AGORA-INTEGRATION] ERROR: Invalid JSON in request body')
      console.error('  - Parse error:', parseError.message)
      console.error('  - Request text:', requestText)
      throw new Error(`Invalid JSON: ${parseError.message}`)
    }

    const { action, ...params } = requestBody
    console.log('[AGORA-INTEGRATION] Action requested:', action)
    console.log('[AGORA-INTEGRATION] Parameters:', JSON.stringify(params, null, 2))

    let result
    const actionStartTime = Date.now()

    switch (action) {
      case 'generate-education-token':
        console.log('[AGORA-INTEGRATION] Handling generate-education-token action')
        result = await handleGenerateEducationToken(params)
        break
      
      case 'create-room':
      case 'flexible-classroom':
        console.log('[AGORA-INTEGRATION] Handling room creation action')
        result = await handleCreateRoom(params)
        break
      
      default:
        console.error('[AGORA-INTEGRATION] ERROR: Unknown action:', action)
        throw new Error(`Unknown action: ${action}`)
    }

    const actionDuration = Date.now() - actionStartTime
    console.log(`[AGORA-INTEGRATION] Action completed in ${actionDuration}ms`)
    console.log('[AGORA-INTEGRATION] Action result:', JSON.stringify(result, null, 2))
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
    console.error('[AGORA-INTEGRATION] Caught error:', error)
    console.error('  - Error type:', typeof error)
    console.error('  - Error name:', error.name)
    console.error('  - Error message:', error.message)
    console.error('  - Error stack:', error.stack)
    
    if (error.cause) {
      console.error('  - Error cause:', error.cause)
    }
    
    console.error('=== AGORA INTEGRATION ERROR DEBUG END ===')

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
        timestamp: new Date().toISOString(),
        debug: {
          errorType: typeof error,
          errorName: error.name
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleCreateRoom(params: any) {
  console.log('[AGORA-INTEGRATION] Creating flexible classroom room')
  console.log('  - Input params:', JSON.stringify(params, null, 2))
  
  try {
    const roomResult = await handleFlexibleClassroom(params)
    console.log('[AGORA-INTEGRATION] Room creation successful')
    console.log('  - Room result:', JSON.stringify(roomResult, null, 2))
    return roomResult
  } catch (error: any) {
    console.error('[AGORA-INTEGRATION] Room creation failed:', error)
    console.error('  - Will re-throw error for main handler')
    throw error
  }
}

async function handleGenerateEducationToken(params: any) {
  console.log('[AGORA-INTEGRATION] Generating education token')
  console.log('  - Input params:', JSON.stringify(params, null, 2))
  
  const { roomUuid, userUuid, userRole, expireTimeInSeconds = 86400 } = params
  
  if (!roomUuid || !userUuid || !userRole) {
    console.error('[AGORA-INTEGRATION] ERROR: Missing required token parameters')
    console.error('  - roomUuid missing:', !roomUuid)
    console.error('  - userUuid missing:', !userUuid)
    console.error('  - userRole missing:', !userRole)
    throw new Error('Missing required parameters: roomUuid, userUuid, userRole')
  }

  // Get credentials from environment
  const appId = Deno.env.get('AGORA_APP_ID')
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
  
  console.log('[AGORA-INTEGRATION] Environment check for token generation:')
  console.log('  - AGORA_APP_ID:', appId ? `Present (${appId.length} chars)` : 'MISSING')
  console.log('  - AGORA_APP_CERTIFICATE:', appCertificate ? `Present (${appCertificate.length} chars)` : 'MISSING')
  
  if (!appId || !appCertificate) {
    console.error('[AGORA-INTEGRATION] ERROR: Missing Agora credentials for token generation')
    throw new Error('Missing Agora credentials in environment variables')
  }

  // Map user role to education role number
  let roleNumber: number
  switch (userRole.toLowerCase()) {
    case 'teacher':
    case 'tutor':
      roleNumber = EDUCATION_ROLES.TEACHER
      break
    case 'student':
      roleNumber = EDUCATION_ROLES.STUDENT
      break
    case 'assistant':
      roleNumber = EDUCATION_ROLES.ASSISTANT
      break
    case 'observer':
      roleNumber = EDUCATION_ROLES.OBSERVER
      break
    default:
      roleNumber = EDUCATION_ROLES.STUDENT // Default to student
      break
  }

  console.log('[AGORA-INTEGRATION] Role mapping:')
  console.log('  - Input role:', userRole)
  console.log('  - Mapped role number:', roleNumber)

  try {
    const educationToken = await generateEducationToken(
      appId,
      appCertificate,
      roomUuid,
      userUuid,
      roleNumber,
      expireTimeInSeconds
    )

    console.log('[AGORA-INTEGRATION] Education token generated successfully')
    console.log('  - Token length:', educationToken.length)

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
  } catch (error: any) {
    console.error('[AGORA-INTEGRATION] Education token generation failed:', error)
    throw new Error(`Education token generation failed: ${error.message}`)
  }
}
