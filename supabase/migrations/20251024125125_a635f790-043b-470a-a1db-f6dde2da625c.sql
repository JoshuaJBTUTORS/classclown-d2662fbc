-- Create lesson proposals table
create table public.lesson_proposals (
  id uuid primary key default gen_random_uuid(),
  student_id bigint references public.students(id),
  parent_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  recipient_email text not null,
  recipient_name text not null,
  
  -- Lesson details
  lesson_type text not null,
  subject text not null,
  price_per_lesson numeric not null,
  payment_cycle text not null,
  lesson_times jsonb not null default '[]'::jsonb,
  
  -- Proposal status
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'agreed', 'card_captured', 'completed', 'declined')),
  access_token text not null unique,
  
  -- Timestamps
  sent_at timestamptz,
  viewed_at timestamptz,
  agreed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create lesson proposal signatures table
create table public.lesson_proposal_signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.lesson_proposals(id) on delete cascade not null,
  signer_user_id uuid references auth.users(id),
  signer_name text not null,
  signer_email text not null,
  ip_address text,
  user_agent text,
  signed_at timestamptz not null default now(),
  agreement_text text not null,
  created_at timestamptz not null default now()
);

-- Create lesson proposal payment methods table
create table public.lesson_proposal_payment_methods (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.lesson_proposals(id) on delete cascade not null,
  stripe_setup_intent_id text not null,
  stripe_payment_method_id text not null,
  stripe_customer_id text not null,
  card_last4 text,
  card_brand text,
  card_exp_month integer,
  card_exp_year integer,
  billing_name text,
  billing_email text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.lesson_proposals enable row level security;
alter table public.lesson_proposal_signatures enable row level security;
alter table public.lesson_proposal_payment_methods enable row level security;

-- RLS Policies for lesson_proposals
create policy "Owners and admins can manage all proposals"
  on public.lesson_proposals
  for all
  to authenticated
  using (has_role(auth.uid(), 'owner'::app_role) or has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'owner'::app_role) or has_role(auth.uid(), 'admin'::app_role));

create policy "Anyone can view proposals with valid token"
  on public.lesson_proposals
  for select
  to authenticated
  using (true);

create policy "Anyone can update proposals with valid token"
  on public.lesson_proposals
  for update
  to authenticated
  using (true);

-- RLS Policies for lesson_proposal_signatures
create policy "Owners and admins can view all signatures"
  on public.lesson_proposal_signatures
  for select
  to authenticated
  using (has_role(auth.uid(), 'owner'::app_role) or has_role(auth.uid(), 'admin'::app_role));

create policy "Anyone can create signatures"
  on public.lesson_proposal_signatures
  for insert
  to authenticated
  with check (true);

-- RLS Policies for lesson_proposal_payment_methods
create policy "Owners and admins can view all payment methods"
  on public.lesson_proposal_payment_methods
  for select
  to authenticated
  using (has_role(auth.uid(), 'owner'::app_role) or has_role(auth.uid(), 'admin'::app_role));

create policy "System can create payment methods"
  on public.lesson_proposal_payment_methods
  for insert
  to authenticated
  with check (true);

-- Create indexes
create index idx_lesson_proposals_access_token on public.lesson_proposals(access_token);
create index idx_lesson_proposals_status on public.lesson_proposals(status);
create index idx_lesson_proposals_created_by on public.lesson_proposals(created_by);
create index idx_lesson_proposal_signatures_proposal_id on public.lesson_proposal_signatures(proposal_id);
create index idx_lesson_proposal_payment_methods_proposal_id on public.lesson_proposal_payment_methods(proposal_id);

-- Create trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_lesson_proposals_updated_at
  before update on public.lesson_proposals
  for each row
  execute function update_updated_at_column();