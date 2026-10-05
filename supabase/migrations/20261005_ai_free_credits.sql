-- Forever AI allowance: every account gets a one-time pool of free AI requests
-- (writing AI: shortcut menu, chat, hub, rewrite). Once used, AI needs Pro.
alter table player_profiles add column if not exists ai_free_used int not null default 0;

-- Atomically spend one free request. Returns the new count, or null when the
-- user has already used p_limit.
create or replace function consume_free_ai(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update player_profiles set ai_free_used = ai_free_used + 1
    where user_id = p_user and ai_free_used < p_limit
    returning ai_free_used into n;
  return n;
end $$;

revoke execute on function consume_free_ai(uuid, int) from public, anon, authenticated;
grant execute on function consume_free_ai(uuid, int) to service_role;
