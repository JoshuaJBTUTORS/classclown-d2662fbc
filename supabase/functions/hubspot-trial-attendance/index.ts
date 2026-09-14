import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  lessonId: string;
  studentId: number;
  status: string;
}

const searchContactBy = async (
  apiKey: string,
  propertyName: string,
  value: string,
): Promise<string | null> => {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value }] }],
      properties: ['email'],
      limit: 1,
    }),
  });
  if (!res.ok) {
    console.error(`HubSpot search by ${propertyName} failed:`, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.results?.length ? data.results[0].id : null;
};

const phoneVariants = (phone: string): string[] => {
  const digits = phone.replace(/[^\d+]/g, '');
  const variants = new Set<string>([phone.trim(), digits]);
  const bare = digits.replace(/^\+/, '');
  if (bare.startsWith('44')) {
    variants.add(`+${bare}`);
    variants.add(`0${bare.slice(2)}`);
  } else if (bare.startsWith('0')) {
    variants.add(`+44${bare.slice(1)}`);
    variants.add(`44${bare.slice(1)}`);
  }
  return [...variants].filter(Boolean);
};

const findContact = async (
  apiKey: string,
  email?: string | null,
  phone?: string | null,
): Promise<string | null> => {
  if (email) {
    const byEmail = await searchContactBy(apiKey, 'email', email);
    if (byEmail) return byEmail;
  }
  if (phone) {
    for (const variant of phoneVariants(phone)) {
      for (const prop of ['phone', 'mobilephone']) {
        const found = await searchContactBy(apiKey, prop, variant);
        if (found) return found;
      }
    }
  }
  return null;
};

// Resolve the hs_lead_status option value: prefer exact internal value, fall back to label match.
const resolveLeadStatusValue = async (
  apiKey: string,
  preferredValue: string,
  label: string,
): Promise<string | null> => {
  const res = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/hs_lead_status', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error('HubSpot hs_lead_status property fetch failed:', res.status, await res.text());
    return null;
  }
  const prop = await res.json();
  const options: Array<{ label?: string; value?: string }> = prop.options || [];
  const norm = (s: string) => s.trim().toLowerCase().replace(/[_-]/g, ' ');

  const byValue = options.find((o) => (o.value || '').trim() === preferredValue);
  if (byValue?.value) return byValue.value;

  const byLabel = options.find(
    (o) => norm(o.label || '') === norm(label) || norm(o.value || '') === norm(label),
  );
  if (byLabel?.value) return byLabel.value;

  console.error(
    `No hs_lead_status option matching "${label}" (${preferredValue}). Available:`,
    options.map((o) => `${o.label}=${o.value}`).join(', '),
  );
  return null;
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
    const { lessonId, studentId, status }: RequestBody = await req.json();
    if (!lessonId || !studentId || !status) {
      return new Response(JSON.stringify({ error: 'lessonId, studentId and status are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mapping: Record<string, { value: string; label: string }> = {
      attended: { value: 'TRIAL_LESSON_COMPLETE', label: 'Trial Lesson Complete' },
      absent: { value: 'UNQUALIFIED', label: 'No Show' },
    };
    const target = mapping[status];
    if (!target) {
      return new Response(JSON.stringify({ skipped: true, reason: `status ${status} not mapped` }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, lesson_type, trial_booking_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError) throw new Error(`Lesson lookup failed: ${lessonError.message}`);
    if (!lesson) {
      return new Response(JSON.stringify({ skipped: true, reason: 'lesson not found' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (lesson.lesson_type !== 'trial' && lesson.lesson_type !== 'demo') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not a trial lesson' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let email: string | null = null;
    let phone: string | null = null;

    if (lesson.trial_booking_id) {
      const { data: booking } = await supabase
        .from('trial_bookings')
        .select('email, phone')
        .eq('id', lesson.trial_booking_id)
        .maybeSingle();
      email = booking?.email ?? null;
      phone = booking?.phone ?? null;
    }

    if (!email && !phone) {
      // Fall back to the trial booking linked to this lesson, then the student's parent
      const { data: bookingByLesson } = await supabase
        .from('trial_bookings')
        .select('email, phone')
        .eq('lesson_id', lessonId)
        .maybeSingle();
      email = bookingByLesson?.email ?? null;
      phone = bookingByLesson?.phone ?? null;
    }

    if (!email && !phone) {
      const { data: student } = await supabase
        .from('students')
        .select('parent_id')
        .eq('id', studentId)
        .maybeSingle();
      if (student?.parent_id) {
        const { data: parent } = await supabase
          .from('parents')
          .select('email, phone')
          .eq('id', student.parent_id)
          .maybeSingle();
        email = parent?.email ?? null;
        phone = parent?.phone ?? null;
      }
    }

    if (!email && !phone) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no contact details found' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contactId = await findContact(apiKey, email, phone);
    if (!contactId) {
      console.warn('No HubSpot contact found for trial attendance', { email, phone });
      return new Response(JSON.stringify({ skipped: true, reason: 'contact not found in HubSpot' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const value = await resolveLeadStatusValue(apiKey, target.value, target.label);
    if (!value) {
      return new Response(
        JSON.stringify({ error: `No hs_lead_status option for "${target.label}"` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { hs_lead_status: value } }),
    });

    if (!patchRes.ok) {
      const body = await patchRes.text();
      console.error('HubSpot lead status update failed:', patchRes.status, body);
      return new Response(
        JSON.stringify({ error: 'HubSpot update failed', status: patchRes.status, details: body }),
        { status: patchRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Updated HubSpot contact ${contactId} lead status to ${value} (${status})`);
    return new Response(JSON.stringify({ success: true, contactId, leadStatus: value }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('hubspot-trial-attendance error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
