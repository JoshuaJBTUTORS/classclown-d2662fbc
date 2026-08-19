import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const prefix: string = body.prefix ?? "";
  const started = Date.now();
  let deleted = 0;

  try {
    while (Date.now() - started < 100_000) {
      const { data, error } = await supabase.storage
        .from("teaching-materials")
        .list(prefix, { limit: 1000 });
      if (error) throw error;
      if (!data || data.length === 0) break;

      const paths = data
        .filter((f) => f.id !== null)
        .map((f) => (prefix ? `${prefix}/${f.name}` : f.name));
      if (paths.length === 0) break;

      const { error: delErr } = await supabase.storage
        .from("teaching-materials")
        .remove(paths);
      if (delErr) throw delErr;
      deleted += paths.length;
    }

    const { count } = await supabase
      .from("teaching_materials")
      .select("*", { count: "exact", head: true });

    return new Response(JSON.stringify({ deleted, remainingRows: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ deleted, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
