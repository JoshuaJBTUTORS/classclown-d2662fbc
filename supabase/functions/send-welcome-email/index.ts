
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { userId, email, firstName, lastName, role, password = "jbtutors123!" }: WelcomeEmailRequest = await req.json();

    if (!userId || !email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'welcome',
        email: email,
        subject: `Welcome to JB Tutors - Your ${role} account has been created`,
        status: 'pending'
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    }

    // Generate the HTML email content
    const loginUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/auth` || "https://your-app.com/auth";
    
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        firstName,
        lastName,
        email,
        role,
        password,
        loginUrl,
      })
    );

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: 'JB Tutors <onboarding@resend.dev>',
      to: [email],
      subject: `Welcome to JB Tutors - Your ${role} account has been created`,
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      
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
        JSON.stringify({ error: "Failed to send welcome email", details: emailError.message }),
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

    console.log(`Welcome email sent successfully to ${email} for ${role} role`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        notification_id: notification?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
