-- Migration: 20260626213000_initial_cloud_storage.sql

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  start_weight numeric(5,1) not null,
  target_weight numeric(5,1) not null,
  migrated_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_start_weight_positive check (start_weight > 0),
  constraint app_users_target_weight_positive check (target_weight > 0),
  constraint app_users_target_below_start check (target_weight < start_weight)
);

create table if not exists public.weight_entries (
  id text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  measured_at timestamptz not null,
  weight numeric(5,1) not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weight_entries_weight_positive check (weight > 0),
  constraint weight_entries_source_valid check (source in ('manual', 'migration'))
);

create index if not exists weight_entries_user_id_measured_at_idx
  on public.weight_entries (user_id, measured_at desc);

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists set_weight_entries_updated_at on public.weight_entries;
create trigger set_weight_entries_updated_at
before update on public.weight_entries
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.weight_entries enable row level security;

create policy "telegram claim can read own app user"
on public.app_users
for select
to authenticated
using (
  telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
);

create policy "telegram claim can insert own app user"
on public.app_users
for insert
to authenticated
with check (
  telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
);

create policy "telegram claim can update own app user"
on public.app_users
for update
to authenticated
using (
  telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
)
with check (
  telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
);

create policy "telegram claim can read own weight entries"
on public.weight_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = weight_entries.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can insert own weight entries"
on public.weight_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users users
    where users.id = weight_entries.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can update own weight entries"
on public.weight_entries
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = weight_entries.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
)
with check (
  exists (
    select 1
    from public.app_users users
    where users.id = weight_entries.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can delete own weight entries"
on public.weight_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = weight_entries.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

-- Migration: 20260626221500_add_replace_state_rpc.sql

create or replace function public.replace_user_state(
  p_user_id uuid,
  p_entries jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.weight_entries
  where user_id = p_user_id;

  insert into public.weight_entries (id, user_id, measured_at, weight, source)
  select
    entry ->> 'id',
    p_user_id,
    (entry ->> 'measured_at')::timestamptz,
    (entry ->> 'weight')::numeric(5,1),
    coalesce(entry ->> 'source', 'manual')
  from jsonb_array_elements(p_entries) as entry;
end;
$$;

revoke all on function public.replace_user_state(uuid, jsonb) from public;
grant execute on function public.replace_user_state(uuid, jsonb) to service_role;
