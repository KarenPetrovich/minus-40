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
