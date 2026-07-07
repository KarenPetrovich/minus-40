alter table public.app_users
  add column if not exists plateau_started_at bigint,
  add column if not exists last_confirmed_milestone numeric(5,1),
  add column if not exists plateau_start_weight numeric(5,1);
