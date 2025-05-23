
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface WebhookPayload {
  type: string
  table: string
  record: {
    id: string
    [key: string]: any
  }
  schema: string
  old_record: null | {
    id: string
    [key: string]: any
  }
}

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify that the caller has the owner role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Check if the user has the owner role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      
    if (rolesError) {
      return new Response(JSON.stringify({ error: 'Error verifying role' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Only owners can create auth triggers' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Check if the trigger already exists
    const { data: existingTrigger, error: triggerError } = await supabase
      .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' })
    
    if (triggerError) {
      return new Response(JSON.stringify({ error: 'Error checking for trigger', details: triggerError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    if (existingTrigger && existingTrigger.exists) {
      return new Response(JSON.stringify({ message: 'Auth trigger already exists' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Create the trigger
    const { data, error } = await supabase.rpc('create_auth_user_trigger')
    
    if (error) {
      return new Response(JSON.stringify({ error: 'Error creating trigger', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Auth trigger created successfully' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
