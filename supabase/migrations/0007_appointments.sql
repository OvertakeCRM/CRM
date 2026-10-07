-- Appointments: a rep books a time with a prospect they've spoken to.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  rep_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  duration_minutes int not null default 30 check (duration_minutes between 5 and 480),
  notes text,
  created_at timestamptz not null default now()
);

create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_rep_idx on public.appointments (rep_id);

alter table public.appointments enable row level security;

create policy "appointments_select_own_or_admin"
  on public.appointments for select
  to authenticated
  using (rep_id = auth.uid() or public.is_admin());

create policy "appointments_insert_own_or_admin"
  on public.appointments for insert
  to authenticated
  with check (rep_id = auth.uid() or public.is_admin());

create policy "appointments_delete_own_or_admin"
  on public.appointments for delete
  to authenticated
  using (rep_id = auth.uid() or public.is_admin());
