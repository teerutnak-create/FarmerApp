begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'New user',
  phone text,
  login_identifier text not null,
  date_of_birth date,
  group_id text not null default 'pakmai',
  group_name text not null default 'กลุ่มวิสาหกิจชุมชน ต.ผักไหม',
  role text not null default 'farmer' check (role in ('farmer', 'officer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_login_identifier_lower_uidx
  on public.profiles (lower(login_identifier));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_login_identifier text;
  v_date_of_birth date;
begin
  v_login_identifier := lower(btrim(coalesce(
    new.raw_user_meta_data ->> 'login_identifier',
    split_part(coalesce(new.email, ''), '@', 1)
  )));

  if v_login_identifier = '' then
    raise exception 'A login identifier is required to create a profile';
  end if;

  if nullif(new.raw_user_meta_data ->> 'date_of_birth', '') is not null then
    v_date_of_birth := (new.raw_user_meta_data ->> 'date_of_birth')::date;
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    login_identifier,
    date_of_birth,
    group_id,
    group_name,
    role
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    v_login_identifier,
    v_date_of_birth,
    'pakmai',
    'กลุ่มวิสาหกิจชุมชน ต.ผักไหม',
    'farmer'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
$$;

create or replace function public.current_profile_group_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.group_id
  from public.profiles as p
  where p.id = (select auth.uid())
$$;

create table if not exists public.farm_logs (
  id uuid primary key,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  record_type text not null check (record_type in ('daily', 'annual', 'sensor', 'photo', 'plot', 'yield', 'other')),
  payload jsonb not null,
  recorded_at timestamptz not null default now(),
  group_id text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default now()
);

create index if not exists farm_logs_farmer_recorded_at_idx
  on public.farm_logs (farmer_id, recorded_at desc);

create index if not exists farm_logs_group_recorded_at_idx
  on public.farm_logs (group_id, recorded_at desc);

create or replace function public.set_farm_log_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_group_id text;
begin
  v_role := public.current_profile_role();
  v_group_id := public.current_profile_group_id();

  if auth.uid() is null or v_role is null or v_group_id is null then
    raise exception 'An authenticated profile is required to write farm logs';
  end if;

  if v_role = 'farmer' then
    if new.farmer_id is distinct from auth.uid() then
      raise exception 'Farmers can only write their own logs';
    end if;
  elsif v_role = 'officer' then
    if not exists (
      select 1
      from public.profiles as farmer
      where farmer.id = new.farmer_id
        and farmer.role = 'farmer'
        and farmer.group_id = v_group_id
    ) then
      raise exception 'Officers can only write logs for farmers in their group';
    end if;
  else
    raise exception 'Unsupported profile role';
  end if;

  if tg_op = 'INSERT' then
    new.group_id := v_group_id;
    new.created_by := auth.uid();
    new.created_at := coalesce(new.created_at, now());
  else
    if new.farmer_id is distinct from old.farmer_id
      or new.id is distinct from old.id then
      raise exception 'Farm log identity cannot be changed';
    end if;
    new.group_id := old.group_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  new.synced_at := now();
  return new;
end;
$$;

drop trigger if exists set_farm_log_scope_before_write on public.farm_logs;
create trigger set_farm_log_scope_before_write
  before insert or update on public.farm_logs
  for each row execute function public.set_farm_log_scope();

create or replace function public.upsert_farm_log(
  p_id uuid,
  p_farmer_id uuid,
  p_record_type text,
  p_payload jsonb,
  p_recorded_at timestamptz
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.farm_logs (id, farmer_id, record_type, payload, recorded_at)
  values (p_id, p_farmer_id, p_record_type, p_payload, p_recorded_at)
  on conflict (id) do update
    set record_type = excluded.record_type,
        payload = excluded.payload,
        recorded_at = excluded.recorded_at;
end;
$$;

alter table public.profiles enable row level security;
alter table public.farm_logs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.farm_logs from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, date_of_birth) on table public.profiles to authenticated;
grant select, delete on table public.farm_logs to authenticated;
grant insert (id, farmer_id, record_type, payload, recorded_at)
  on table public.farm_logs to authenticated;
grant update (record_type, payload, recorded_at)
  on table public.farm_logs to authenticated;

drop policy if exists profiles_select_self_or_group_farmer on public.profiles;
create policy profiles_select_self_or_group_farmer
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
      and role = 'farmer'
    )
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists farm_logs_select_self_or_group on public.farm_logs;
create policy farm_logs_select_self_or_group
  on public.farm_logs
  for select
  to authenticated
  using (
    farmer_id = (select auth.uid())
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
    )
  );

drop policy if exists farm_logs_insert_self_or_group on public.farm_logs;
create policy farm_logs_insert_self_or_group
  on public.farm_logs
  for insert
  to authenticated
  with check (
    (
      public.current_profile_role() = 'farmer'
      and farmer_id = (select auth.uid())
      and group_id = public.current_profile_group_id()
    )
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
      and exists (
        select 1
        from public.profiles as farmer
        where farmer.id = farmer_id
          and farmer.role = 'farmer'
          and farmer.group_id = public.current_profile_group_id()
      )
    )
  );

drop policy if exists farm_logs_update_self_or_group on public.farm_logs;
create policy farm_logs_update_self_or_group
  on public.farm_logs
  for update
  to authenticated
  using (
    farmer_id = (select auth.uid())
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
    )
  )
  with check (
    farmer_id = (select auth.uid())
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
    )
  );

drop policy if exists farm_logs_delete_self_or_group on public.farm_logs;
create policy farm_logs_delete_self_or_group
  on public.farm_logs
  for delete
  to authenticated
  using (
    farmer_id = (select auth.uid())
    or (
      public.current_profile_role() = 'officer'
      and group_id = public.current_profile_group_id()
    )
  );

revoke all on function public.current_profile_role() from public, anon;
revoke all on function public.current_profile_group_id() from public, anon;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_group_id() to authenticated;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_farm_log_scope() from public, anon, authenticated;
revoke all on function public.upsert_farm_log(uuid, uuid, text, jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_farm_log(uuid, uuid, text, jsonb, timestamptz) to authenticated;

alter table public.farm_logs replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'farm_logs'
    ) then
    execute 'alter publication supabase_realtime add table public.farm_logs';
  end if;
end;
$$;

-- Officers are provisioned by an administrator only. After creating an Auth user,
-- assign its role and group from the Supabase SQL Editor:
-- update public.profiles
-- set role = 'officer', group_id = 'pakmai', group_name = 'กลุ่มวิสาหกิจชุมชน ต.ผักไหม'
-- where id = '<auth.users.id>';

commit;
