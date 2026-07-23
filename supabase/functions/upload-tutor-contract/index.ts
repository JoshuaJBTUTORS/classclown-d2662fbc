import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const srcUrl = "https://classclown.lovable.app/__l5e/assets-v1/159a5fbb-27c9-4b1b-a3ca-a01ff0c63191/self-employed-tutor-agreement.pdf";
    const res = await fetch(srcUrl);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `fetch failed ${res.status}` }), { status: 500 });
    }
    const bytes = new Uint8Array(await res.arrayBuffer());

    const { error } = await supabase.storage
      .from("tutor-documents")
      .upload("self-employed-tutor-agreement.pdf", bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const { data } = supabase.storage
      .from("tutor-documents")
      .getPublicUrl("self-employed-tutor-agreement.pdf");

    return new Response(JSON.stringify({ ok: true, size: bytes.length, url: data.publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
