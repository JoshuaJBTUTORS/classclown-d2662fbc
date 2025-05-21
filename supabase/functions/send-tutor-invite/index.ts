
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  tutorId: string;
}

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

    // Verify user is authenticated
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

    // Get the request body
    const { email, firstName, lastName, tutorId } = await req.json() as InviteRequest;

    // Generate a unique invitation token
    const inviteToken = crypto.randomUUID();
    
    // Store invitation in database
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        token: inviteToken,
        role: 'tutor',
        entity_id: tutorId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_by: user.id
      });

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Get domain configuration
    const { data: domainConfig } = await supabase
      .from('organization_settings')
      .select('domain_name, organization_name')
      .single();
    
    const appDomain = domainConfig?.domain_name || `${Deno.env.get("SUPABASE_REFERENCE_ID")}.supabase.co`;
    const orgName = domainConfig?.organization_name || "Our Tutoring Platform";
    
    // Send invitation email - in a real implementation, use a service like Resend or SendGrid
    console.log(`Sending invitation email to ${email} with token ${inviteToken}`);

    // For demonstration, we'll just log the email we would send
    const inviteLink = `https://${appDomain}/invite?token=${inviteToken}`;
    const emailBody = `
      Hello ${firstName} ${lastName},
      
      You've been invited to join ${orgName} as a tutor.
      
      Click the link below to create your account:
      ${inviteLink}
      
      This invitation will expire in 7 days.
      
      Best regards,
      ${orgName} Team
    `;

    console.log("EMAIL BODY:", emailBody);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-tutor-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
