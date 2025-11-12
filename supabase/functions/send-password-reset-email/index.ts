import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PasswordResetEmail } from './_templates/password-reset-email.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface PasswordReset {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email }: PasswordReset = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Processing password reset request for:", email);

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error("Error checking users:", userError);
      throw userError;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      console.log("User not found, but returning success for security");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "If an account with that email exists, a password reset email has been sent." 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Clean up old tokens for this email
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email);

    // Generate custom reset token
    const resetToken = crypto.randomUUID();
    
    // Store token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        email: email,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      throw tokenError;
    }

    console.log("Created reset token:", tokenData.id);

    // Create reset URL pointing to the current domain 
    const resetUrl = `https://jb-tutors.lovable.app/auth?tab=reset-password&token=${resetToken}`;
    
    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        email: email,
        resetUrl: resetUrl,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "JB Tutors <noreply@jb-tutors.com>",
      to: [email],
      subject: "Reset Your JB Tutors Password",
      html,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send password reset email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);