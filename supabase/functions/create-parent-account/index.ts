import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PASSWORD = 'classbeyond123!';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl ?? '', serviceRoleKey ?? '');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'No user found') }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !userRoles?.some((r: any) => ['admin', 'owner'].includes(r.role))) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      billing_address,
      emergency_contact_name,
      emergency_contact_phone,
    } = await req.json();

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log('create-parent-account: onboarding email', normalizedEmail);

    // ---------- 1. Find or create the auth user (NEVER delete) ----------
    let authUserId: string | null = null;
    let page = 1;
    const perPage = 1000;
    while (page <= 100) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listError) {
        console.error('listUsers error:', listError);
        break;
      }
      const match = (listData?.users || []).find(
        (u: any) => (u.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (match) {
        authUserId = match.id;
        break;
      }
      if (!listData?.users || listData.users.length < perPage) break;
      page++;
    }

    if (authUserId) {
      console.log('Reusing existing auth user', authUserId, '— resetting password');
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name, last_name, role: 'parent' },
      });
      if (updErr) {
        console.error('updateUserById error:', updErr);
        return new Response(
          JSON.stringify({ error: 'Failed to reset existing account password: ' + updErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name, last_name, role: 'parent' },
      });
      if (createErr || !created?.user) {
        console.error('createUser error:', createErr);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account: ' + (createErr?.message || 'unknown') }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authUserId = created.user.id;
      console.log('Created new auth user', authUserId);
    }

    // Make sure a 'parent' role row exists (handle_new_user trigger may already have inserted one).
    await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: authUserId, role: 'parent', is_primary: true },
        { onConflict: 'user_id,role' }
      );

    // ---------- 2. Find or create the parents row ----------
    const { data: existingParent, error: parentLookupErr } = await supabaseAdmin
      .from('parents')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (parentLookupErr) {
      console.error('parents lookup error:', parentLookupErr);
    }

    let parentId: string;
    if (existingParent?.id) {
      parentId = existingParent.id;
      const { error: updParentErr } = await supabaseAdmin
        .from('parents')
        .update({
          user_id: authUserId,
          first_name,
          last_name,
          phone,
          billing_address,
          emergency_contact_name,
          emergency_contact_phone,
        })
        .eq('id', parentId);
      if (updParentErr) {
        console.error('parents update error:', updParentErr);
        return new Response(
          JSON.stringify({ error: 'Failed to update parent profile: ' + updParentErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Reused parents row', parentId);
    } else {
      const { data: newParent, error: insParentErr } = await supabaseAdmin
        .from('parents')
        .insert({
          user_id: authUserId,
          first_name,
          last_name,
          email,
          phone,
          billing_address,
          emergency_contact_name,
          emergency_contact_phone,
        })
        .select('id')
        .single();
      if (insParentErr || !newParent) {
        console.error('parents insert error:', insParentErr);
        return new Response(
          JSON.stringify({ error: 'Failed to create parent profile: ' + (insParentErr?.message || 'unknown') }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      parentId = newParent.id;
      console.log('Created parents row', parentId);
    }

    // ---------- 3. Link students with matching email to this parent ----------
    // 3a. Any student whose OWN email matches
    const { data: studentsByEmail } = await supabaseAdmin
      .from('students')
      .select('id, parent_id')
      .ilike('email', normalizedEmail);

    // 3b. Any student whose current parent row shares this email (stale duplicate parents)
    const { data: staleParents } = await supabaseAdmin
      .from('parents')
      .select('id')
      .ilike('email', normalizedEmail)
      .neq('id', parentId);

    let studentsViaStale: any[] = [];
    if (staleParents && staleParents.length > 0) {
      const staleIds = staleParents.map((p: any) => p.id);
      const { data } = await supabaseAdmin
        .from('students')
        .select('id, parent_id')
        .in('parent_id', staleIds);
      studentsViaStale = data || [];
    }

    // 3c. Any UNLINKED student whose phone matches the parent's phone
    // (covers trials booked with a different email address).
    const phoneKey = (value: unknown): string => {
      let digits = String(value ?? '').replace(/\D/g, '');
      if (digits.startsWith('00')) digits = digits.slice(2);
      if (digits.startsWith('44')) digits = digits.slice(2);
      while (digits.startsWith('0')) digits = digits.slice(1);
      return digits;
    };

    const parentPhoneKey = phoneKey(phone);
    let studentsByPhone: any[] = [];
    if (parentPhoneKey.length >= 9) {
      const { data: unlinkedStudents, error: phoneLookupErr } = await supabaseAdmin
        .from('students')
        .select('id, parent_id, phone, email')
        .is('parent_id', null)
        .not('phone', 'is', null);

      if (phoneLookupErr) {
        console.error('student phone lookup error:', phoneLookupErr);
      } else {
        studentsByPhone = (unlinkedStudents || []).filter(
          (s: any) => phoneKey(s.phone) === parentPhoneKey
        );
        if (studentsByPhone.length > 0) {
          console.log(
            'Matched student(s) by phone:',
            studentsByPhone.map((s: any) => `${s.id} (${s.email ?? 'no email'})`)
          );
        }
      }
    }

    const toLink = new Map<number, { id: number; parent_id: string | null }>();
    (studentsByEmail || []).forEach((s: any) => toLink.set(s.id, s));
    studentsViaStale.forEach((s: any) => toLink.set(s.id, s));
    studentsByPhone.forEach((s: any) => toLink.set(s.id, { id: s.id, parent_id: s.parent_id }));


    const idsNeedingUpdate = Array.from(toLink.values())
      .filter((s) => s.parent_id !== parentId)
      .map((s) => s.id);

    let linkedStudents = 0;
    if (idsNeedingUpdate.length > 0) {
      const { error: linkErr } = await supabaseAdmin
        .from('students')
        .update({ parent_id: parentId })
        .in('id', idsNeedingUpdate);
      if (linkErr) {
        console.error('student link error:', linkErr);
      } else {
        linkedStudents = idsNeedingUpdate.length;
        console.log(`Linked ${linkedStudents} student(s) to parent ${parentId}`);
      }
    }
    // ---------- 4. Activate any trial students in this family ----------
    // Collect every student that belongs to this family:
    //  - matched by the parent's email (student email == parent email)
    //  - already linked to this parent row
    const { data: familyStudents, error: familyErr } = await supabaseAdmin
      .from('students')
      .select('id, status, email')
      .eq('parent_id', parentId);

    if (familyErr) {
      console.error('family students lookup error:', familyErr);
    }

    const candidateIds = Array.from(
      new Set<number>([
        ...Array.from(toLink.keys()),
        ...((familyStudents || []).map((s: any) => s.id) as number[]),
      ])
    );

    let activatedStudents = 0;
    let activationError: string | null = null;

    if (candidateIds.length > 0) {
      // Read current statuses explicitly (no PostgREST .or() filter on update —
      // that silently failed before and left students on 'trial').
      const { data: candidateRows, error: statusErr } = await supabaseAdmin
        .from('students')
        .select('id, status')
        .in('id', candidateIds);

      if (statusErr) {
        console.error('student status lookup error:', statusErr);
        activationError = statusErr.message;
      } else {
        const needsActivation = (candidateRows || [])
          .filter((s: any) => {
            const st = (s.status ?? '').toString().trim().toLowerCase();
            return st === '' || st === 'trial';
          })
          .map((s: any) => s.id);

        console.log('Students needing activation:', needsActivation);

        if (needsActivation.length > 0) {
          const { data: activatedRows, error: activateErr } = await supabaseAdmin
            .from('students')
            .update({ status: 'active' })
            .in('id', needsActivation)
            .select('id, status');

          if (activateErr) {
            console.error('student activation error:', activateErr);
            activationError = activateErr.message;
          } else {
            activatedStudents = (activatedRows || []).length;
            console.log(
              `Activated ${activatedStudents} student(s) for parent ${parentId}`,
              activatedRows
            );

            // Verify nothing is left on trial
            const { data: stillTrial } = await supabaseAdmin
              .from('students')
              .select('id, status')
              .in('id', needsActivation)
              .eq('status', 'trial');
            if (stillTrial && stillTrial.length > 0) {
              activationError = `Failed to activate student id(s): ${stillTrial
                .map((s: any) => s.id)
                .join(', ')}`;
              console.error(activationError);
            }
          }
        }
      }
    }

    if (activationError) {
      return new Response(
        JSON.stringify({
          error: `Parent account created, but student activation failed: ${activationError}`,
          parent: { id: parentId, user_id: authUserId, email },
          linkedStudents,
          activatedStudents,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }



    const parts: string[] = [];
    if (linkedStudents > 0) parts.push(`Linked ${linkedStudents} student(s)`);
    if (activatedStudents > 0) parts.push(`activated ${activatedStudents}`);

    return new Response(
      JSON.stringify({
        success: true,
        parent: { id: parentId, user_id: authUserId, email },
        linkedStudents,
        activatedStudents,
        message:
          parts.length > 0
            ? `Parent account ready. ${parts.join(', ')}.`
            : 'Parent account ready.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('create-parent-account unexpected error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
