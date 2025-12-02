import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = user.email;
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    const roles = userRoles?.map(r => r.role) || [];
    console.log(`User ${email} has roles: ${roles.join(', ')}`);

    // Get the shared secret
    const secret = Deno.env.get('HEYCLEO_CROSS_PLATFORM_SECRET');
    if (!secret) {
      console.error('HEYCLEO_CROSS_PLATFORM_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HMAC-signed token
    const timestamp = Date.now();
    const encoder = new TextEncoder();
    
    // Create HMAC key from secret
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the data (email:timestamp) - Must match CRM format
    const data = encoder.encode(`${email}:${timestamp}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create token payload with roles
    const tokenData = JSON.stringify({
      email,
      timestamp,
      roles,
      signature
    });
    
    // Encode as base64
    const token = btoa(tokenData);

    console.log(`Generated HeyCleo token for user: ${email} with roles: ${roles.join(', ')}`);

    return new Response(
      JSON.stringify({ token, email, roles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating HeyCleo token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
