import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface PasswordChangeRequest {
  userId?: string;
  email?: string;
  newPassword: string;
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
    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify the requesting user is authenticated and has admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user has admin or owner role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Insufficient permissions. Admin role required." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { userId, email, newPassword }: PasswordChangeRequest = await req.json();
    
    if ((!userId && !email) || !newPassword) {
      return new Response(JSON.stringify({ error: "User ID or email and new password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let targetUserId = userId;
    
    // If email provided, find the user ID
    if (email && !userId) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers?.users.find(u => u.email === email);
      
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "User not found with provided email" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      targetUserId = targetUser.id;
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Admin password change request by:", user.email, "for user:", targetUserId);

    // Update user password using admin API
    const { data: userData, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUserId!,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update failed:", updateError);
      return new Response(JSON.stringify({ 
        error: updateError.message || "Failed to update password" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Password updated successfully for user:", targetUserId, "by admin:", user.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password updated successfully",
      user: {
        id: userData.user?.id,
        email: userData.user?.email
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in admin-change-password function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to update password" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);