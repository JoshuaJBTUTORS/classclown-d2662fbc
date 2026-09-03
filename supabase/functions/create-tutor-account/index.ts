import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = "https://classclowncrm.com";

const DEFAULT_PASSWORD = "classbeyond123!";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: { user }, error: authError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (!roles?.some((r) => r.role === "admin" || r.role === "owner")) {
      return json({ error: "Insufficient permissions" }, 403);
    }

    const { offerId } = await req.json();
    if (!offerId || typeof offerId !== "string") {
      return json({ error: "offerId is required" }, 400);
    }

    const { data: offer, error: offerError } = await admin
      .from("tutor_offers")
      .select("*")
      .eq("id", offerId)
      .maybeSingle();
    if (offerError) throw offerError;
    if (!offer) return json({ error: "Offer not found" }, 404);

    const email = String(offer.recipient_email).trim().toLowerCase();
    const nameParts = String(offer.recipient_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Tutor";
    const lastName = nameParts.slice(1).join(" ") || "";

    // 1. Tutor record (matched by email)
    const { data: existingTutor } = await admin
      .from("tutors")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    let tutorId = offer.tutor_id || existingTutor?.id || null;

    if (tutorId) {
      await admin
        .from("tutors")
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          status: "active",
          normal_hourly_rate: Number(offer.hourly_rate),
          joined_date: offer.start_date,
        })
        .eq("id", tutorId);
    } else {
      const { data: newTutor, error: tutorError } = await admin
        .from("tutors")
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          status: "active",
          normal_hourly_rate: Number(offer.hourly_rate),
          joined_date: offer.start_date,
        })
        .select("id")
        .single();
      if (tutorError) throw new Error(`Failed to create tutor: ${tutorError.message}`);
      tutorId = newTutor.id;
    }

    // 2. Auth user
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let authUser = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
    let tempPassword: string | null = null;
    let created = false;

    if (!authUser) {
      tempPassword = DEFAULT_PASSWORD;
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, role: "tutor" },
      });
      if (createError) throw new Error(`Failed to create login: ${createError.message}`);
      authUser = newUser.user!;
      created = true;
    } else {
      await admin.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...(authUser.user_metadata || {}),
          first_name: firstName,
          last_name: lastName,
          role: "tutor",
        },
      });
    }

    // 3. Profile + role
    await admin.from("profiles").upsert({
      id: authUser.id,
      first_name: firstName,
      last_name: lastName,
    });

    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("role", "tutor")
      .maybeSingle();
    if (!existingRole) {
      await admin.from("user_roles").insert({
        user_id: authUser.id,
        role: "tutor",
        is_primary: true,
      });
    }

    // 4. Link offer
    await admin
      .from("tutor_offers")
      .update({ tutor_id: tutorId })
      .eq("id", offer.id);

    // 5. Welcome email with credentials (only when newly created)
    let emailed = false;
    if (created && tempPassword && Deno.env.get("RESEND_API_KEY")) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
        await resend.emails.send({
          from: "Class Beyond <enquiries@classbeyondacademy.io>",
          to: [email],
          subject: "Your Class Beyond tutor account is ready",
          html: `
            <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1e3a5f">Welcome aboard, ${firstName}!</h2>
              <p>Your tutor account has been created. You can sign in straight away using the details below:</p>
              <p style="background:#f6f9fc;border-radius:8px;padding:16px">
                <strong>Email:</strong> ${email}<br/>
                <strong>Temporary password:</strong> ${tempPassword}
              </p>
              <p><a href="${APP_URL}/auth" style="background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Sign in</a></p>
              <p>Please change your password after your first login.</p>
              <p style="color:#8898aa;font-size:13px">Class Beyond Academy</p>
            </div>`,
        });
        emailed = true;
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
    }

    return json({
      success: true,
      created,
      emailed,
      tutorId,
      userId: authUser.id,
      email,
      tempPassword,
      message: created
        ? "Tutor account created"
        : "Existing login found — tutor record linked and role ensured",
    });
  } catch (error: any) {
    console.error("create-tutor-account error:", error);
    return json({ error: error.message }, 500);
  }
});
