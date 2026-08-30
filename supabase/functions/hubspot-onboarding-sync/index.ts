import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const hubspotFetch = async (apiKey: string, path: string, init: RequestInit) => {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const details = await res.text();
    console.error(`HubSpot ${path} failed [${res.status}]: ${details}`);
    throw new Error(`HubSpot ${path} failed [${res.status}]: ${details}`);
  }
  return res.json();
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const hubspotApiKey = Deno.env.get('HUBSPOT_API_KEY');
  if (!hubspotApiKey) {
    return json({ error: 'HUBSPOT_API_KEY not configured' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Missing authorization' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return json({ error: 'Invalid session' }, 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone_number, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();

    // Gather the children (or the student's own record) server-side.
    let students: Array<{ first_name: string | null; last_name: string | null; school: string | null; year_group: string | null }> = [];

    const { data: parentRow } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (parentRow) {
      const { data } = await supabase
        .from('students')
        .select('first_name, last_name, school, year_group')
        .eq('parent_id', parentRow.id)
        .order('first_name');
      students = data || [];
    } else {
      const { data } = await supabase
        .from('students')
        .select('first_name, last_name, school, year_group')
        .eq('user_id', user.id);
      students = data || [];
    }

    const email = user.email;
    if (!email) return json({ error: 'User has no email' }, 400);

    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    const phone = profile?.phone_number || '';
    const completedAt = profile?.onboarding_completed_at || new Date().toISOString();

    // Find existing contact by email
    const search = await hubspotFetch(hubspotApiKey, '/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: ['email'],
        limit: 1,
      }),
    });

    const properties: Record<string, string> = { email };
    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;
    if (phone) properties.phone = phone;

    let contactId: string;
    if (search.results?.length) {
      contactId = search.results[0].id;
      await hubspotFetch(hubspotApiKey, `/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      });
    } else {
      const created = await hubspotFetch(hubspotApiKey, '/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties }),
      });
      contactId = created.id;
    }

    const childLines = students.length
      ? students
          .map((s) => {
            const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unnamed student';
            return `- ${name} | School: ${s.school || 'Not provided'} | Year group: ${s.year_group || 'Not provided'}`;
          })
          .join('\n')
      : '- No linked student records';

    const noteBody = `Platform onboarding completed
Parent/Student: ${[firstName, lastName].filter(Boolean).join(' ') || email}
Email: ${email}
Phone: ${phone || 'Not provided'}
Completed at: ${completedAt}

Students:
${childLines}`;

    await hubspotFetch(hubspotApiKey, '/crm/v3/objects/notes', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: noteBody,
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
          },
        ],
      }),
    });

    console.log(`Onboarding synced to HubSpot contact ${contactId} for ${email}`);
    return json({ success: true, contactId, students: students.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('hubspot-onboarding-sync error:', message);
    return json({ error: message }, 500);
  }
});
