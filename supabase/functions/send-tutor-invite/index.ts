
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { TutorInviteEmail } from "./_templates/tutor-invite-email.tsx";

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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'tutor_invite',
        email: email,
        subject: 'Tutor invitation sent',
        status: 'pending'
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    }

    // Get domain configuration
    const { data: domainConfig } = await supabase
      .from('organization_settings')
      .select('domain_name, organization_name')
      .single();
    
    const appDomain = domainConfig?.domain_name || `${Deno.env.get("SUPABASE_REFERENCE_ID")}.supabase.co`;
    const orgName = domainConfig?.organization_name || "JB Tutors";
    
    // Generate the HTML email content
    const inviteLink = `https://${appDomain}/invite?token=${inviteToken}`;
    
    const html = await renderAsync(
      React.createElement(TutorInviteEmail, {
        firstName,
        lastName,
        inviteLink,
        organizationName: orgName,
      })
    );

    // Send the invitation email
    const { error: emailError } = await resend.emails.send({
      from: 'Class Beyond <enquiries@classbeyondacademy.io>',
      to: [email],
      subject: `You're invited to join ${orgName} as a tutor`,
      html,
    });

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      
      // Update notification status to failed
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: emailError.message
          })
          .eq('id', notification.id);
      }

      return new Response(
        JSON.stringify({ error: "Failed to send invitation email", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update notification status to sent
    if (notification) {
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }

    console.log(`Tutor invitation sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tutor invitation sent successfully",
        notification_id: notification?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-tutor-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
