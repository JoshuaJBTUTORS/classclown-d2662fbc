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

const clean = (v: unknown, max = 300) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const referrerName = clean(body.referrer_name, 120);
    const referrerEmail = clean(body.referrer_email, 200).toLowerCase();
    const referrerPhone = clean(body.referrer_phone, 30);
    const friendName = clean(body.friend_name, 120);
    const friendEmail = clean(body.friend_email, 200).toLowerCase();
    const friendPhone = clean(body.friend_phone, 30);
    const childName = clean(body.child_name, 120);
    const notes = clean(body.notes, 1000);

    if (!referrerName) return json({ error: 'Please enter your name' }, 400);
    if (!referrerEmail && !referrerPhone) {
      return json({ error: 'Please add your email or phone number' }, 400);
    }
    if (referrerEmail && !isEmail(referrerEmail)) {
      return json({ error: 'Please enter a valid email address' }, 400);
    }
    if (!friendName) return json({ error: "Please enter your friend's name" }, 400);
    if (!friendEmail && !friendPhone) {
      return json({ error: "Please add your friend's email or phone number" }, 400);
    }
    if (friendEmail && !isEmail(friendEmail)) {
      return json({ error: "Please enter a valid email address for your friend" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Duplicate guard: same friend contact submitted in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let dupQuery = supabase.from('referrals').select('id').gte('created_at', since).limit(1);
    if (friendEmail) dupQuery = dupQuery.eq('friend_email', friendEmail);
    else dupQuery = dupQuery.eq('friend_phone', friendPhone);
    const { data: dup } = await dupQuery;
    if (dup && dup.length > 0) {
      return json({ success: true, duplicate: true });
    }

    // Try to match the referrer to an existing account by email
    let referrerUserId: string | null = null;
    if (referrerEmail) {
      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', referrerEmail)
        .maybeSingle();
      if (profileMatch?.id) referrerUserId = profileMatch.id as string;

      if (!referrerUserId) {
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const match = list?.users?.find(
          (u) => (u.email || '').toLowerCase() === referrerEmail
        );
        if (match) referrerUserId = match.id;
      }
    }

    // Resolve or create a referral code for the matched user (or guest)
    let referralCode: string | null = null;
    if (!referrerUserId && referrerEmail) {
      const { data: guestCode } = await supabase
        .from('referral_codes')
        .select('code')
        .ilike('guest_email', referrerEmail)
        .is('user_id', null)
        .maybeSingle();
      if (guestCode?.code) referralCode = guestCode.code;
    }
    if (!referralCode && referrerUserId) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', referrerUserId)
        .maybeSingle();

      if (existing?.code) {
        referralCode = existing.code;
      } else {
        const prefix =
          referrerName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CBA';
        for (let i = 0; i < 5; i++) {
          const candidate = `${prefix}${randomCode(4)}`;
          const { data, error } = await supabase
            .from('referral_codes')
            .insert({ user_id: referrerUserId, code: candidate })
            .select('code')
            .single();
          if (!error && data) {
            referralCode = data.code;
            break;
          }
        }
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: referrerUserId,
        referral_code: referralCode,
        referrer_name: referrerName,
        referrer_email: referrerEmail || null,
        referrer_phone: referrerPhone || null,
        friend_name: friendName,
        friend_email: friendEmail || null,
        friend_phone: friendPhone || null,
        child_name: childName || null,
        notes: notes || null,
        source: 'public_form',
        status: 'invited',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('submit-public-referral insert error', insertError);
      return json({ error: 'Could not save your referral. Please try again.' }, 500);
    }

    try {
      await supabase.functions.invoke('send-referral-notification', {
        body: {
          referralId: inserted.id,
          referrerName,
          referrerEmail: referrerEmail || referrerPhone,
          friendName,
          friendEmail,
          friendPhone,
          childName,
          notes,
          referralCode: referralCode || '',
        },
      });
    } catch (e) {
      console.error('Referral notification failed (referral still saved):', e);
    }

    return json({ success: true });
  } catch (e) {
    console.error('submit-public-referral error', e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
