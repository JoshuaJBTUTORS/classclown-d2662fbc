import React from 'npm:react@18.3.1';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from 'npm:resend@4.0.0';
import {
  renderAsync,
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// ---------- Inlined email template ----------
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 0 48px', maxWidth: '600px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const h1 = { color: '#1e3a5f', fontSize: '32px', fontWeight: '700', margin: '0 0 24px 0', padding: '0 48px', textAlign: 'center' as const };
const greeting = { color: '#333', fontSize: '18px', fontWeight: '600', margin: '24px 0 16px 0', padding: '0 48px' };
const text = { color: '#555', fontSize: '16px', lineHeight: '28px', margin: '16px 0', padding: '0 48px' };
const button = { backgroundColor: '#1e3a5f', borderRadius: '10px', color: '#fff', fontSize: '18px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' as const, display: 'block', padding: '18px 40px', margin: '32px 48px' };
const hr = { borderColor: '#e6ebf1', margin: '32px 48px' };
const footer = { color: '#8898aa', fontSize: '13px', padding: '0 48px', textAlign: 'center' as const };

interface EmailProps {
  recipientName: string;
  position: string;
  hourlyRate: number;
  startDate: string;
  offerUrl: string;
}

const TutorOfferEmail = ({ recipientName, position, hourlyRate, startDate, offerUrl }: EmailProps) =>
  React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, 'You have received a job offer from Class Beyond Academy'),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Heading, { style: h1 }, "🎉 You're Hired!"),
        React.createElement(Text, { style: greeting }, `Dear ${recipientName},`),
        React.createElement(Text, { style: text },
          'We are thrilled to offer you the position of ',
          React.createElement('strong', null, position),
          ' at ',
          React.createElement('strong', null, 'Class Beyond Academy'),
          '.'
        ),
        React.createElement(Text, { style: text },
          React.createElement('strong', null, 'Position:'), ` ${position}`,
          React.createElement('br', null),
          React.createElement('strong', null, 'Salary:'), ` £${hourlyRate.toFixed(2)} per hour`,
          React.createElement('br', null),
          React.createElement('strong', null, 'Start date:'), ` ${new Date(startDate).toLocaleDateString('en-GB')}`,
        ),
        React.createElement(Text, { style: text }, 'Please review and sign your offer letter online by clicking the button below:'),
        React.createElement(Link, { href: offerUrl, target: '_blank', style: button }, '📋 View & Sign Your Offer'),
        React.createElement(Hr, { style: hr }),
        React.createElement(Text, { style: footer },
          React.createElement('strong', null, 'Class Beyond Academy'),
          React.createElement('br', null),
          'Helping Every Child Shine ✨'
        ),
      )
    )
  );
// ---------- /Inlined email template ----------

function makeDocRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${block(5)}-${block(5)}-${block(5)}-${block(5)}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

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
      TutorOfferEmail({
        recipientName: body.recipientName,
        position: offer.position,
        hourlyRate: Number(offer.hourly_rate),
        startDate: offer.start_date,
        offerUrl,
      }) as any
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
