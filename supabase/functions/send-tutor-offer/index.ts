import React from 'npm:react@18.3.1';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { TutorOfferEmail } from './_templates/tutor-offer-email.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface OfferRequest {
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  position?: string;
  hourlyRate: number;
  startDate: string;
  minHoursPerWeek?: number;
  customIntro?: string;
  tutorId?: string;
}

function makeDocRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${block(5)}-${block(5)}-${block(5)}-${block(5)}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Verify caller is admin/owner
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'owner');
    if (!isAdmin) throw new Error('Only admins/owners can send offers');

    const body: OfferRequest = await req.json();
    if (!body.recipientName || !body.recipientEmail || !body.hourlyRate || !body.startDate) {
      throw new Error('Missing required fields');
    }

    const documentRef = makeDocRef();

    const { data: offer, error: insertError } = await supabase
      .from('tutor_offers')
      .insert({
        tutor_id: body.tutorId || null,
        created_by: user.id,
        recipient_name: body.recipientName,
        recipient_email: body.recipientEmail,
        recipient_phone: body.recipientPhone || null,
        position: body.position || 'Tutor',
        hourly_rate: body.hourlyRate,
        start_date: body.startDate,
        min_hours_per_week: body.minHoursPerWeek ?? 15,
        custom_intro: body.customIntro || null,
        document_ref: documentRef,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !offer) throw insertError || new Error('Failed to create offer');

    const offerUrl = `https://classclowncrm.com/offer/${offer.id}/${offer.access_token}`;

    const html = await renderAsync(
      React.createElement(TutorOfferEmail, {
        recipientName: body.recipientName,
        position: offer.position,
        hourlyRate: Number(offer.hourly_rate),
        startDate: offer.start_date,
        offerUrl,
      })
    );

    const { error: emailError } = await resend.emails.send({
      from: 'Class Beyond <enquiries@classbeyondacademy.io>',
      to: [body.recipientEmail],
      subject: `Your Offer Letter from Class Beyond Academy`,
      html,
    });

    if (emailError) console.error('Email error:', emailError);

    return new Response(
      JSON.stringify({ success: true, offerId: offer.id, offerUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('send-tutor-offer error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
