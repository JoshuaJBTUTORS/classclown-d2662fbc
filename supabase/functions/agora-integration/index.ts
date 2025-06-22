
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
    
    // Route all actions through the flexible classroom handler
    switch (action) {
      case 'generate-education-token':
      case 'create-room':
      case 'flexible-classroom':
        console.log(`[PROCESSING] Handling ${action} action`)
        result = await handleFlexibleClassroom(params)
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
