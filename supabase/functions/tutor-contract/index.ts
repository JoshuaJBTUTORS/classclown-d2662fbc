import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase.storage
      .from('tutor-documents')
      .createSignedUrl('self-employed-tutor-agreement.pdf', 60 * 60);

    if (error || !data?.signedUrl) {
      console.error('signed url error', error);
      return new Response('Contract unavailable', { status: 500, headers: corsHeaders });
    }

    return Response.redirect(data.signedUrl, 302);
  } catch (e) {
    console.error('tutor-contract error', e);
    return new Response('Contract unavailable', { status: 500, headers: corsHeaders });
  }
});
