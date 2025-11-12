
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    
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

    // Initial OAuth authorization URL generation
    if (action === "authorize") {
      const organizationId = url.searchParams.get("organization_id");
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      // Store organization_id in session for later use during callback
      await supabase
        .from('google_calendar_credentials')
        .delete()
        .eq('organization_id', organizationId);

      // Generate a state value to prevent CSRF attacks
      const state = crypto.randomUUID();
      
      // Store the state and organization_id in a temporary table or session
      // For simplicity, we're using the state as a key in organization_id
      const stateData = {
        state,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      };
      
      await supabase.from('google_oauth_states').upsert(stateData);
      
      // Define the required Google Calendar API scopes
      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
      ].join(" ");
      
      // Construct the authorization URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scopes);
      authUrl.searchParams.append("access_type", "offline");
      // Force approval prompt to ensure we get a refresh token
      authUrl.searchParams.append("prompt", "consent");
      authUrl.searchParams.append("state", state);
      
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    // Handle the OAuth callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      
      if (!code) {
        throw new Error("Authorization code is missing");
      }
      
      if (!state) {
        throw new Error("State parameter is missing");
      }
      
      // Retrieve the organization_id from the state
      const { data: stateData, error: stateError } = await supabase
        .from('google_oauth_states')
        .select('organization_id')
        .eq('state', state)
        .single();
      
      if (stateError || !stateData) {
        throw new Error("Invalid state parameter");
      }
      
      const organizationId = stateData.organization_id;
      
      // Clean up the state entry
      await supabase
        .from('google_oauth_states')
        .delete()
        .eq('state', state);
      
      // Exchange the authorization code for tokens
      const tokenRequestBody = new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code"
      });
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: tokenRequestBody.toString()
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`Token exchange error: ${tokenData.error}`);
      }
      
      // Get user info to determine primary calendar ID
      const userInfoResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });
      
      const calendarListData = await userInfoResponse.json();
      let primaryCalendarId = null;
      
      // Find the primary calendar
      if (calendarListData.items && calendarListData.items.length > 0) {
        const primaryCalendar = calendarListData.items.find(cal => cal.primary === true);
        if (primaryCalendar) {
          primaryCalendarId = primaryCalendar.id;
        } else {
          primaryCalendarId = calendarListData.items[0].id;
        }
      }
      
      // Store the tokens and user info in the database
      const credentials = {
        organization_id: organizationId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        expiry_date: Math.floor(Date.now() / 1000) + tokenData.expires_in
      };
      
      // Save credentials to database
      await supabase
        .from('google_calendar_credentials')
        .upsert(credentials);
      
      // Update organization with Google Calendar enabled and calendar ID
      await supabase
        .from('organizations')
        .update({
          google_calendar_enabled: true,
          google_calendar_id: primaryCalendarId
        })
        .eq('id', organizationId);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
