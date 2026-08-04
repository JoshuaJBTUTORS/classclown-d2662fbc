import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { referralCode, trialBookingId, friendName, friendEmail, friendPhone, childName } = await req.json();

    if (!referralCode || !trialBookingId) {
      return new Response(JSON.stringify({ error: 'referralCode and trialBookingId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const code = String(referralCode).trim().toUpperCase();

    const { data: codeRow } = await supabase
      .from('referral_codes')
      .select('user_id, code, guest_name, guest_email')
      .eq('code', code)
      .maybeSingle();

    if (!codeRow) {
      console.log('Unknown referral code:', code);
      return new Response(JSON.stringify({ success: false, reason: 'unknown_code' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to match an existing pending referral by email or phone
    let existingId: string | null = null;
    const candidatesQuery = supabase
      .from('referrals')
      .select('id, friend_email, friend_phone, status')
      .eq('status', 'invited');

    const { data: candidates } = codeRow.user_id
      ? await candidatesQuery.eq('referrer_user_id', codeRow.user_id)
      : await candidatesQuery.eq('referral_code', codeRow.code);

    const normalisedEmail = (friendEmail || '').trim().toLowerCase();
    const phoneDigits = (friendPhone || '').replace(/\D/g, '').slice(-9);

    for (const candidate of candidates || []) {
      const candEmail = (candidate.friend_email || '').trim().toLowerCase();
      const candPhone = (candidate.friend_phone || '').replace(/\D/g, '').slice(-9);
      if ((normalisedEmail && candEmail === normalisedEmail) || (phoneDigits && candPhone === phoneDigits)) {
        existingId = candidate.id;
        break;
      }
    }

    if (existingId) {
      await supabase
        .from('referrals')
        .update({ status: 'trial_booked', trial_booking_id: trialBookingId })
        .eq('id', existingId);
    } else {
      await supabase.from('referrals').insert({
        referrer_user_id: codeRow.user_id,
        referral_code: codeRow.code,
        referrer_name: codeRow.user_id ? null : codeRow.guest_name || null,
        referrer_email: codeRow.user_id ? null : codeRow.guest_email || null,
        friend_name: friendName || 'Trial booking',
        friend_email: normalisedEmail || null,
        friend_phone: friendPhone || null,
        child_name: childName || null,
        status: 'trial_booked',
        source: 'link',
        trial_booking_id: trialBookingId,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('link-trial-referral error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
