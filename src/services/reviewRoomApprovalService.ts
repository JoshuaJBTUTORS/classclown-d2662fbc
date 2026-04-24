import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

const REVIEW_ROOM_URL = 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84';

export interface ReviewRoomBookingRow {
  id: string;
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  status: string;
  message?: string | null;
}

interface ApproveArgs {
  bookings: ReviewRoomBookingRow[]; // all sessions for one parent group
  selectedIds: string[];           // subset to approve
  approvedBy?: string | null;
}

interface ApproveResult {
  success: boolean;
  approvedCount: number;
  skipped: { bookingId: string; reason: string }[];
  error?: string;
}

/**
 * Find the existing Review Room lesson on the calendar that matches a booking.
 * Bookings store preferred_date (YYYY-MM-DD) and preferred_time (HH:mm or HH:mm:ss)
 * which represent UK wall-clock time. Calendar lessons are stored in UTC.
 */
async function findMatchingReviewRoomLesson(
  date: string,
  time: string,
): Promise<{ id: string; tutor_id: string | null } | null> {
  // Normalise time to HH:mm
  const hhmm = time.length >= 5 ? time.slice(0, 5) : time;

  // Build the UK-local datetime then convert to UTC.
  // We do a window search (+/- 5 minutes) to be tolerant of any minor drift.
  // UK uses BST (+1) most of the year — using toISOString of a plain Date
  // assumes the runtime TZ. To be safe we compute via a UTC offset lookup.
  const localIso = `${date}T${hhmm}:00`;

  // Use Intl to resolve the UTC instant for that wall-clock time in Europe/London.
  // Trick: format a Date as Europe/London and find the offset.
  const probe = new Date(`${localIso}Z`); // pretend it's UTC first
  const ukParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(probe);
  const get = (t: string) => ukParts.find((p) => p.type === t)?.value ?? '';
  const ukReadback = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
  // Difference between assumed-UTC time and UK readback gives offset in minutes.
  const offsetMinutes =
    (Date.parse(`${ukReadback}Z`) - probe.getTime()) / 60000;
  const utcInstant = new Date(probe.getTime() - offsetMinutes * 60000);

  const lo = new Date(utcInstant.getTime() - 5 * 60000).toISOString();
  const hi = new Date(utcInstant.getTime() + 5 * 60000).toISOString();

  const { data, error } = await supabase
    .from('lessons')
    .select('id, tutor_id, start_time')
    .ilike('subject', '%review room%')
    .gte('start_time', lo)
    .lte('start_time', hi)
    .limit(1);

  if (error) {
    console.error('Lesson lookup error', error);
    return null;
  }
  return data && data[0] ? { id: data[0].id, tutor_id: data[0].tutor_id } : null;
}

async function resolveOrCreateStudent(
  email: string,
  childName: string,
  phone?: string | null,
): Promise<number | null> {
  // Try to find existing
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing?.id) return existing.id as unknown as number;

  const parts = childName.trim().split(/\s+/);
  const first_name = parts[0] || childName;
  const last_name = parts.slice(1).join(' ') || '';

  const { data: created, error } = await supabase
    .from('students')
    .insert({
      first_name,
      last_name,
      email,
      phone: phone || null,
      parent_id: null,
      account_type: 'trial',
      trial_status: 'pending',
      status: 'trial',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Student create error', error);
    return null;
  }
  return created.id as unknown as number;
}

export const approveReviewRoomBookings = async (
  args: ApproveArgs,
): Promise<ApproveResult> => {
  const { bookings, selectedIds, approvedBy } = args;
  const skipped: ApproveResult['skipped'] = [];

  if (selectedIds.length === 0) {
    return { success: false, approvedCount: 0, skipped, error: 'No sessions selected' };
  }

  const head = bookings[0];
  if (!head) {
    return { success: false, approvedCount: 0, skipped, error: 'No bookings provided' };
  }

  // 1. Resolve student
  const studentId = await resolveOrCreateStudent(head.email, head.child_name, head.phone);
  if (!studentId) {
    return { success: false, approvedCount: 0, skipped, error: 'Failed to create/find student' };
  }

  // 2. For each selected booking, attach to lesson + mark approved
  const approvedSessionsForEmail: { date: string; time: string }[] = [];

  for (const id of selectedIds) {
    const b = bookings.find((x) => x.id === id);
    if (!b || !b.preferred_date || !b.preferred_time) {
      skipped.push({ bookingId: id, reason: 'Missing date/time' });
      continue;
    }

    const lesson = await findMatchingReviewRoomLesson(b.preferred_date, b.preferred_time);
    if (!lesson) {
      skipped.push({ bookingId: id, reason: `No matching Review Room lesson for ${b.preferred_date} ${b.preferred_time}` });
      continue;
    }

    // Add student to lesson (ignore duplicate)
    const { error: linkErr } = await supabase
      .from('lesson_students')
      .insert({ lesson_id: lesson.id, student_id: studentId });
    if (linkErr && !`${linkErr.message}`.toLowerCase().includes('duplicate')) {
      console.warn('lesson_students insert error (continuing):', linkErr);
    }

    // Update booking row
    const { error: updErr } = await supabase
      .from('trial_bookings')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy || null,
        lesson_id: lesson.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', b.id);
    if (updErr) {
      console.error('Booking update failed:', updErr);
      skipped.push({ bookingId: id, reason: 'DB update failed' });
      continue;
    }

    approvedSessionsForEmail.push({
      date: format(parseISO(b.preferred_date), 'EEEE, MMMM do, yyyy'),
      time: b.preferred_time.slice(0, 5),
    });
  }

  // 3. Send combined approval notification
  if (approvedSessionsForEmail.length > 0) {
    try {
      await supabase.functions.invoke('send-review-room-approval', {
        body: {
          parentName: head.parent_name,
          childName: head.child_name,
          email: head.email,
          phone: head.phone || undefined,
          sessions: approvedSessionsForEmail,
          studentLessonLink: REVIEW_ROOM_URL,
        },
      });
    } catch (notifyErr) {
      console.error('Approval notification failed (booking still approved):', notifyErr);
    }
  }

  return {
    success: approvedSessionsForEmail.length > 0,
    approvedCount: approvedSessionsForEmail.length,
    skipped,
  };
};
