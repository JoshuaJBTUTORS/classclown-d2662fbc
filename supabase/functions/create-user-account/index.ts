
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'tutor' | 'student';
  password?: string;
  sendWelcomeEmail?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use service role client to create accounts without affecting current session
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      password = "jbtutors123!", 
      sendWelcomeEmail = true 
    }: CreateAccountRequest = await req.json();

    if (!email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating account for ${email} with role ${role}`);

    // Create user account using admin client
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
      },
      email_confirm: true // Auto-confirm email for admin-created accounts
    });

    if (createError) {
      console.error('Error creating user account:', createError);
      throw createError;
    }

    if (!userData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log(`User account created successfully: ${userData.user.id}`);

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      console.log('Sending welcome email...');
      const { error: emailError } = await supabaseAdmin.functions.invoke('send-welcome-email', {
        body: {
          userId: userData.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          password: password
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        return new Response(
          JSON.stringify({ 
            success: true,
            userId: userData.user.id,
            message: "Account created successfully, but welcome email failed to send",
            emailError: emailError.message
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log('Welcome email sent successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: userData.user.id,
        message: "Account created successfully" + (sendWelcomeEmail ? " and welcome email sent" : "")
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in create-user-account function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create account",
        details: error
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
