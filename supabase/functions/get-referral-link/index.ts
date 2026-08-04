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

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (length = 4) =>
  Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

const BASE_URL = 'https://classclowncrm.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body.name, 120);
    const email = clean(body.email, 200).toLowerCase();

    if (!name) return json({ error: 'Please enter your name' }, 400);
    if (!email || !isEmail(email)) return json({ error: 'Please enter a valid email address' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Match an existing account by email so codes stay tied to one person
    let userId: string | null = null;
    const { data: profileMatch } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (profileMatch?.id) userId = profileMatch.id as string;

    if (!userId) {
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = list?.users?.find((u) => (u.email || '').toLowerCase() === email);
      if (match) userId = match.id;
    }

    // Existing code?
    let existingCode: string | null = null;
    if (userId) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .maybeSingle();
      existingCode = existing?.code ?? null;
    } else {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .ilike('guest_email', email)
        .is('user_id', null)
        .maybeSingle();
      existingCode = existing?.code ?? null;
    }

    if (existingCode) {
      return json({ code: existingCode, shareUrl: `${BASE_URL}/book-trial?ref=${existingCode}` });
    }

    const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CBA';

    for (let i = 0; i < 5; i++) {
      const candidate = `${prefix}${randomCode(4)}`;
      const insertRow = userId
        ? { user_id: userId, code: candidate }
        : { user_id: null, code: candidate, guest_name: name, guest_email: email };

      const { data, error } = await supabase
        .from('referral_codes')
        .insert(insertRow)
        .select('code')
        .single();

      if (!error && data) {
        return json({ code: data.code, shareUrl: `${BASE_URL}/book-trial?ref=${data.code}` });
      }

      // Concurrent create for the same owner
      if (error && error.code === '23505') {
        const query = supabase.from('referral_codes').select('code');
        const { data: retry } = userId
          ? await query.eq('user_id', userId).maybeSingle()
          : await query.ilike('guest_email', email).is('user_id', null).maybeSingle();
        if (retry?.code) {
          return json({ code: retry.code, shareUrl: `${BASE_URL}/book-trial?ref=${retry.code}` });
        }
      }
    }

    return json({ error: 'Could not create your link. Please try again.' }, 500);
  } catch (e) {
    console.error('get-referral-link error', e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
