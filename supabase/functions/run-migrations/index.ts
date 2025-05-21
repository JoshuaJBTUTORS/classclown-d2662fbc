
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
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
    
    // SQL for creating invitation functions
    const sql = `
    -- Create RPC function to fetch invitation details by token
    CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_param TEXT)
    RETURNS json AS $$
    DECLARE
      result json;
    BEGIN
      WITH invite_data AS (
        SELECT 
          i.*,
          os.organization_name,
          CASE
            WHEN i.role = 'tutor' THEN (
              SELECT json_build_object('first_name', t.first_name, 'last_name', t.last_name)
              FROM tutors t
              WHERE t.id::text = i.entity_id
            )
            WHEN i.role = 'student' THEN (
              SELECT json_build_object('first_name', s.first_name, 'last_name', s.last_name)
              FROM students s
              WHERE s.id::text = i.entity_id
            )
            ELSE NULL
          END AS entity_data
        FROM
          public.invitations i
        LEFT JOIN
          public.organization_settings os ON true
        WHERE
          i.token = token_param
          AND (i.expires_at > NOW() OR i.accepted_at IS NOT NULL)
      )
      SELECT 
        json_build_object(
          'id', id,
          'email', email,
          'role', role,
          'entity_id', entity_id,
          'expires_at', expires_at,
          'created_at', created_at,
          'accepted_at', accepted_at,
          'organization_name', organization_name,
          'first_name', COALESCE((entity_data->>'first_name')::text, ''),
          'last_name', COALESCE((entity_data->>'last_name')::text, '')
        ) INTO result
      FROM invite_data;

      RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create RPC function to mark invitation as accepted
    CREATE OR REPLACE FUNCTION public.accept_invitation(token_param TEXT)
    RETURNS boolean AS $$
    DECLARE
      updated_rows int;
    BEGIN
      UPDATE public.invitations
      SET accepted_at = NOW()
      WHERE token = token_param
      AND accepted_at IS NULL
      AND expires_at > NOW();

      GET DIAGNOSTICS updated_rows = ROW_COUNT;
      RETURN updated_rows > 0;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('pg_query', { query_text: sql });
    
    if (migrationError) {
      throw migrationError;
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Migration completed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-migrations function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
