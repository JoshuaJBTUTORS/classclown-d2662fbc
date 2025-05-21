
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY, 
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        } 
      }
    );
    
    // Verify user is authenticated and is an admin/owner
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is an admin or owner
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'owner');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create the google_oauth_states table
    const sql = `
    CREATE TABLE IF NOT EXISTS public.google_oauth_states (
      state UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT google_oauth_states_organization_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE CASCADE
    );
    
    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_google_oauth_states_state ON public.google_oauth_states(state);
    
    -- Create a function to clean up expired states (older than 1 hour)
    CREATE OR REPLACE FUNCTION clean_expired_oauth_states()
    RETURNS void AS $$
    BEGIN
      DELETE FROM public.google_oauth_states
      WHERE created_at < NOW() - INTERVAL '1 hour';
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    const { error: sqlError } = await supabase.rpc('pg_query', { query_text: sql });
    
    if (sqlError) {
      throw new Error(`Error creating google_oauth_states table: ${sqlError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Google OAuth states table created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-oauth-states-table function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
