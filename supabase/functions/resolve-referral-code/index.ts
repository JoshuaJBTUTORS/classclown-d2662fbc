import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';

    if (!raw || raw.length > 32 || !/^[A-Z0-9-]+$/.test(raw)) {
      return json({ found: false });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: codeRow } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', raw)
      .maybeSingle();

    if (!codeRow?.user_id) return json({ found: false });

    let firstName = '';

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', codeRow.user_id)
      .maybeSingle();

    if (profile?.first_name) firstName = String(profile.first_name).trim();

    if (!firstName) {
      const { data: userRes } = await supabase.auth.admin.getUserById(codeRow.user_id);
      const meta = (userRes?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const candidate =
        (meta.first_name as string) ||
        (meta.full_name as string) ||
        (meta.name as string) ||
        '';
      firstName = String(candidate).trim().split(' ')[0] || '';
    }

    if (!firstName) return json({ found: false });

    return json({ found: true, firstName: firstName.split(' ')[0] });
  } catch (e) {
    console.error('resolve-referral-code error', e);
    return json({ found: false });
  }
});
