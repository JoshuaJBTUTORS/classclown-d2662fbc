import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";
import { Resend } from "npm:resend@2.0.0";
import { loginLinkEmailHtml } from "./_templates/login-link-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_ORIGIN = "https://classclowncrm.com";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const genericSuccess = () =>
  new Response(
    JSON.stringify({
      success: true,
      message: "If an account with that email exists, a login link has been sent.",
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );

const handler = async (req: Request): Promise<Response> => {
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
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || rawEmail.length > 255 || !EMAIL_RE.test(rawEmail)) {
      return new Response(JSON.stringify({ error: "A valid email address is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Login link requested for:", rawEmail);

    // Only mint links for existing accounts (never auto-create users here).
    const { data: existing, error: lookupError } = await supabase
      .schema("auth")
      .from("users")
      .select("id")
      .ilike("email", rawEmail)
      .maybeSingle();

    if (lookupError) {
      console.error("User lookup failed:", lookupError.message);
      return new Response(JSON.stringify({ error: "Failed to send login link" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!existing) {
      console.log("No account found for that email, returning generic success");
      return genericSuccess();
    }

    // Mint a Supabase tokenised magic link.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: rawEmail,
      options: { redirectTo: `${APP_ORIGIN}/` },
    });


    if (error || !data?.properties?.action_link) {
      console.log("Could not generate link (user may not exist):", error?.message);
      return genericSuccess();
    }

    // Force the verification callback to always come back to classclowncrm.com,
    // never a lovable.app preview/published URL.
    const actionLink = new URL(data.properties.action_link);
    actionLink.searchParams.set("redirect_to", `${APP_ORIGIN}/`);
    const loginUrl = actionLink.toString();

    const emailResponse = await resend.emails.send({
      from: "Class Beyond Academy <enquiries@classbeyondacademy.io>",
      to: [rawEmail],
      subject: "Your Class Beyond login link",
      html: loginLinkEmailHtml({ email: rawEmail, loginUrl }),
    });

    if ((emailResponse as any)?.error) {
      console.error("Resend error:", (emailResponse as any).error);
      return new Response(JSON.stringify({ error: "Failed to send login link" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Login link email sent:", (emailResponse as any)?.data?.id);
    return genericSuccess();
  } catch (err: any) {
    console.error("Error in send-login-link:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to send login link" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
