create table public.heycleo_students (
  student_id uuid primary key,
  first_name text,
  last_name text,
  email text,
  year_group text,
  education_level text,
  exam_year int,
  exam_month text,
  working_grade jsonb,
  target_grade jsonb,
  school_id uuid,
  tutor_ids uuid[],
  live_tuition_since timestamptz,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now()
);
create index heycleo_students_email_idx on public.heycleo_students (lower(email));

grant select on public.heycleo_students to authenticated;
grant all on public.heycleo_students to service_role;
alter table public.heycleo_students enable row level security;
create policy "Admins and owners can view heycleo students"
on public.heycleo_students for select to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'owner'));

create table public.heycleo_homework_completion (
  assignment_id uuid primary key,
  homework_id uuid,
  student_id uuid,
  title text,
  subject text,
  year_group text,
  assessment_type text,
  tutor_id uuid,
  due_date timestamptz,
  status text,
  started boolean,
  completed boolean,
  assigned_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  marks_awarded int,
  marks_available int,
  percentage numeric,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now()
);
create index heycleo_homework_completion_student_idx on public.heycleo_homework_completion (student_id);

grant select on public.heycleo_homework_completion to authenticated;
grant all on public.heycleo_homework_completion to service_role;
alter table public.heycleo_homework_completion enable row level security;
create policy "Admins and owners can view heycleo homework"
on public.heycleo_homework_completion for select to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'owner'));

create table public.heycleo_sync_state (
  resource text primary key,
  last_server_time timestamptz,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  rows_synced int
);

grant select on public.heycleo_sync_state to authenticated;
grant all on public.heycleo_sync_state to service_role;
alter table public.heycleo_sync_state enable row level security;
create policy "Admins and owners can view heycleo sync state"
on public.heycleo_sync_state for select to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'owner'));