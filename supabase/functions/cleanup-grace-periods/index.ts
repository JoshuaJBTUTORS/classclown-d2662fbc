
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-GRACE-PERIODS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Starting grace period cleanup");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();

    // Find all purchases with expired grace periods
    const { data: expiredPurchases, error: fetchError } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('status', 'grace_period')
      .lt('grace_period_end', now);

    if (fetchError) {
      throw fetchError;
    }

    logStep("Found expired grace periods", { count: expiredPurchases?.length || 0 });

    let updatedCount = 0;

    if (expiredPurchases && expiredPurchases.length > 0) {
      // Update expired grace periods to expired status
      const purchaseIds = expiredPurchases.map(p => p.id);
      
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({
          status: 'expired',
          grace_period_start: null,
          grace_period_end: null,
          previous_status: null,
          updated_at: now
        })
        .in('id', purchaseIds);

      if (updateError) {
        throw updateError;
      }

      updatedCount = expiredPurchases.length;
      logStep("Updated expired grace periods", { updatedCount });

      // Log the expired purchases for tracking
      for (const purchase of expiredPurchases) {
        logStep("Grace period expired", {
          purchaseId: purchase.id,
          userId: purchase.user_id,
          courseId: purchase.course_id,
          gracePeriodEnd: purchase.grace_period_end
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Grace period cleanup completed", 
        updated: updatedCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error during cleanup", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
