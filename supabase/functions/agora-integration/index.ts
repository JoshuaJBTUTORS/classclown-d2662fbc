
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const { action, ...params } = await req.json()
    console.log('[AGORA-INTEGRATION] Action requested:', action, 'with params:', params)

    switch (action) {
      case 'generate-education-token':
        return await handleGenerateEducationToken(params)
      
      case 'flexible-classroom':
        return await handleFlexibleClassroom(params)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error: any) {
    console.error('[AGORA-INTEGRATION] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleGenerateEducationToken(params: any) {
  console.log('[AGORA-INTEGRATION] Generating education token with params:', params)
  
  const { roomUuid, userUuid, userRole, expireTimeInSeconds = 86400 } = params
  
  if (!roomUuid || !userUuid || !userRole) {
    throw new Error('Missing required parameters: roomUuid, userUuid, userRole')
  }

  // Get credentials from environment
  const appId = Deno.env.get('AGORA_APP_ID')
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')
  
  if (!appId || !appCertificate) {
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

    return new Response(
      JSON.stringify({
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
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('[AGORA-INTEGRATION] Education token generation failed:', error)
    throw new Error(`Education token generation failed: ${error.message}`)
  }
}
