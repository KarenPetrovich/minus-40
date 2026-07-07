create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  target_type text not null,
  target_key text not null,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_target_type_valid check (target_type in ('milestone', 'weight_entry')),
  constraint comments_text_not_empty check (length(trim(text)) > 0)
);

create unique index if not exists comments_user_target_unique_idx
  on public.comments (user_id, target_type, target_key);

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();

alter table public.comments enable row level security;

create policy "telegram claim can read own comments"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = comments.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can insert own comments"
on public.comments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users users
    where users.id = comments.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can update own comments"
on public.comments
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = comments.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
)
with check (
  exists (
    select 1
    from public.app_users users
    where users.id = comments.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);

create policy "telegram claim can delete own comments"
on public.comments
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users users
    where users.id = comments.user_id
      and users.telegram_user_id = nullif(auth.jwt() ->> 'telegram_user_id', '')::bigint
  )
);
