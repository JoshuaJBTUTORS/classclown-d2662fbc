import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  proposalId?: string;
  parentEmail: string;
  parentName: string;
  parentPhone?: string | null;
  subject?: string | null;
  lessonType?: string | null;
  contractTerm?: string | null;
  sessionsPerWeek?: number | string | null;
  lessonTimes?: Array<{ day?: string; time?: string; duration?: number }> | null;
}

const findOrCreateContact = async (
  apiKey: string,
  email: string,
  parentName: string,
  phone?: string | null,
): Promise<string> => {
  const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email'],
      limit: 1,
    }),
  });
  if (!searchRes.ok) {
    throw new Error(`HubSpot search failed: ${searchRes.status} ${await searchRes.text()}`);
  }
  const searchData = await searchRes.json();
  if (searchData.results?.length) return searchData.results[0].id;

  const parts = (parentName || '').trim().split(/\s+/);
  const firstname = parts[0] || '';
  const lastname = parts.slice(1).join(' ') || '';
  const properties: Record<string, string> = { email, firstname, lastname };
  if (phone) properties.phone = phone;

  const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  });
  if (!createRes.ok) {
    throw new Error(`HubSpot contact create failed: ${createRes.status} ${await createRes.text()}`);
  }
  const created = await createRes.json();
  return created.id;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('HUBSPOT_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'HUBSPOT_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { parentEmail, parentName, parentPhone, subject, lessonType, contractTerm, sessionsPerWeek, lessonTimes, proposalId } = body;

    if (!parentEmail || !parentName) {
      return new Response(JSON.stringify({ error: 'parentEmail and parentName are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contactId = await findOrCreateContact(apiKey, parentEmail, parentName, parentPhone);

    const sessionsLine = sessionsPerWeek
      ? `${sessionsPerWeek}`
      : (Array.isArray(lessonTimes) ? `${lessonTimes.length}` : 'Not specified');

    const timesBlock = Array.isArray(lessonTimes) && lessonTimes.length
      ? lessonTimes.map((lt) => `- ${lt.day || '—'} at ${lt.time || '—'}${lt.duration ? ` (${lt.duration} min)` : ''}`).join('\n')
      : 'None listed';

    const content = [
      `Client onboarded — payment setup required.`,
      ``,
      `Parent: ${parentName}`,
      `Email: ${parentEmail}`,
      `Phone: ${parentPhone || 'Not provided'}`,
      ``,
      `Subject: ${subject || 'Not specified'}`,
      `Lesson type: ${lessonType || 'Not specified'}`,
      `Contract term: ${contractTerm || 'Not specified'}`,
      `Sessions per week: ${sessionsLine}`,
      ``,
      `Scheduled times:`,
      timesBlock,
      ``,
      proposalId ? `Proposal ID: ${proposalId}` : '',
    ].filter(Boolean).join('\n');

    const ticketRes = await fetch('https://api.hubapi.com/crm/v3/objects/tickets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          subject: `Payment Setup — ${parentName}`,
          content,
          hs_pipeline: '0',
          hs_pipeline_stage: '1',
          hs_ticket_priority: 'HIGH',
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }],
          },
        ],
      }),
    });

    if (!ticketRes.ok) {
      const errBody = await ticketRes.text();
      console.error('HubSpot ticket create failed:', ticketRes.status, errBody);
      return new Response(JSON.stringify({ error: 'Ticket create failed', status: ticketRes.status, details: errBody }), {
        status: ticketRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ticket = await ticketRes.json();
    return new Response(JSON.stringify({ success: true, ticketId: ticket.id, contactId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('hubspot-create-payment-ticket error:', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
