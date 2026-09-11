-- Royal Westmont CRM — initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- profiles (one row per sales rep / admin, mirrors auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'rep' check (role in ('admin', 'rep')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER avoids infinite recursion when policies on `profiles`
-- need to check the caller's own role.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'rep');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- prospects
-- ---------------------------------------------------------------------------
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  warehouse_name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  containers_per_week integer,
  dm_name text,
  dm_phone text,
  dm_email text,
  competitor text,
  assigned_rep_id uuid not null references public.profiles (id),
  stage text not null default 'not_visited' check (stage in (
    'not_visited', 'visited', 'contacted', 'decision_maker_engaged',
    'interested_qualified', 'proposal_sent', 'negotiating', 'sold_won', 'lost'
  )),
  loss_reason text check (loss_reason in ('price', 'competitor', 'no_need', 'bad_timing', 'other')),
  next_follow_up_date date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospects_assigned_rep_idx on public.prospects (assigned_rep_id);
create index prospects_stage_idx on public.prospects (stage);
create index prospects_name_trgm_idx on public.prospects using gin (warehouse_name gin_trgm_ops);
create index prospects_address_trgm_idx on public.prospects using gin (address gin_trgm_ops);

alter table public.prospects enable row level security;

create policy "prospects_select_all"
  on public.prospects for select
  to authenticated
  using (true);

create policy "prospects_insert_own_or_admin"
  on public.prospects for insert
  to authenticated
  with check (assigned_rep_id = auth.uid() or public.is_admin());

create policy "prospects_update_own_or_admin"
  on public.prospects for update
  to authenticated
  using (assigned_rep_id = auth.uid() or public.is_admin())
  with check (assigned_rep_id = auth.uid() or public.is_admin());

create policy "prospects_delete_admin"
  on public.prospects for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- activity_log (append-only audit trail; no update/delete policies)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  rep_id uuid not null references public.profiles (id),
  type text not null check (type in ('stage_change', 'note', 'quick_log')),
  old_stage text,
  new_stage text,
  note text,
  created_at timestamptz not null default now()
);

create index activity_log_prospect_idx on public.activity_log (prospect_id, created_at desc);

alter table public.activity_log enable row level security;

create policy "activity_log_select_all"
  on public.activity_log for select
  to authenticated
  using (true);

create policy "activity_log_insert_owned_prospect"
  on public.activity_log for insert
  to authenticated
  with check (
    rep_id = auth.uid()
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id
        and (p.assigned_rep_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index photos_prospect_idx on public.photos (prospect_id);

alter table public.photos enable row level security;

create policy "photos_select_all"
  on public.photos for select
  to authenticated
  using (true);

create policy "photos_insert_owned_prospect"
  on public.photos for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id
        and (p.assigned_rep_id = auth.uid() or public.is_admin())
    )
  );

create policy "photos_delete_own_or_admin"
  on public.photos for delete
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- app_settings (single row; stale-lead threshold etc.)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  stale_days integer not null default 14
);

insert into public.app_settings (id, stale_days) values (1, 14);

alter table public.app_settings enable row level security;

create policy "app_settings_select_all"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "app_settings_update_admin"
  on public.app_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPCs: atomic stage changes / activity logging
-- SECURITY INVOKER (default) — RLS of the calling user still applies.
-- ---------------------------------------------------------------------------
create function public.change_prospect_stage(
  p_prospect_id uuid,
  p_new_stage text,
  p_note text default null,
  p_loss_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_old_stage text;
begin
  select stage into v_old_stage from public.prospects where id = p_prospect_id;

  update public.prospects
  set stage = p_new_stage,
      loss_reason = case when p_new_stage = 'lost' then p_loss_reason else null end,
      updated_at = now()
  where id = p_prospect_id;

  insert into public.activity_log (prospect_id, rep_id, type, old_stage, new_stage, note)
  values (p_prospect_id, auth.uid(), 'stage_change', v_old_stage, p_new_stage, p_note);
end;
$$;

create function public.log_prospect_activity(
  p_prospect_id uuid,
  p_type text,
  p_note text
)
returns void
language plpgsql
as $$
begin
  insert into public.activity_log (prospect_id, rep_id, type, note)
  values (p_prospect_id, auth.uid(), p_type, p_note);

  update public.prospects set updated_at = now() where id = p_prospect_id;
end;
$$;

create function public.find_similar_prospects(
  p_warehouse_name text,
  p_address text
)
returns table (
  id uuid,
  warehouse_name text,
  address text,
  stage text,
  assigned_rep_id uuid,
  score real
)
language sql
stable
as $$
  select p.id, p.warehouse_name, p.address, p.stage, p.assigned_rep_id,
         greatest(similarity(p.warehouse_name, p_warehouse_name), similarity(p.address, p_address)) as score
  from public.prospects p
  where similarity(p.warehouse_name, p_warehouse_name) > 0.35
     or similarity(p.address, p_address) > 0.35
  order by score desc
  limit 5;
$$;

-- ---------------------------------------------------------------------------
-- Storage: photos bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('prospect-photos', 'prospect-photos', true)
on conflict (id) do nothing;

create policy "prospect_photos_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'prospect-photos');

create policy "prospect_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'prospect-photos');

create policy "prospect_photos_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'prospect-photos' and owner = auth.uid());

-- ---------------------------------------------------------------------------
-- After running this migration, promote your first admin manually:
--   update public.profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'you@royalwestmont.com');
-- ---------------------------------------------------------------------------
