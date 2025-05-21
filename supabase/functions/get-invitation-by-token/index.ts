
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Get the token from the request body
    const { token } = await req.json()
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Run a query using the service role key
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        id, email, role, entity_id, created_at, expires_at, accepted_at,
        organization_settings!inner(organization_name)
      `)
      .eq('token', token)
      .single()

    if (error) throw error

    // If the invitation is for a tutor or student, get their name
    let firstName = null
    let lastName = null

    if (data.entity_id) {
      if (data.role === 'tutor') {
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('first_name, last_name')
          .eq('id', data.entity_id)
          .single()
        
        if (tutorData) {
          firstName = tutorData.first_name
          lastName = tutorData.last_name
        }
      } else if (data.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('first_name, last_name')
          .eq('id', data.entity_id)
          .single()
        
        if (studentData) {
          firstName = studentData.first_name
          lastName = studentData.last_name
        }
      }
    }

    // Format the response
    const response = {
      ...data,
      organization_name: data.organization_settings.organization_name,
      first_name: firstName,
      last_name: lastName
    }
    
    // Remove the nested organization_settings object
    delete response.organization_settings

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
