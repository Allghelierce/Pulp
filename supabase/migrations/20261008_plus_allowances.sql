-- Plus pricing: free accounts get a small DAILY taste of AI recall
-- (AI cards from N focus sessions, N AI-graded answers); Plus is unlimited
-- (daily fair-use cap in ai_usage still applies). Only the service role
-- touches this table (RLS on, no policies) — clients can't reset it.
create table if not exists ai_allowance (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,                                   -- 'cards' | 'grades'
  day date not null default ((now() at time zone 'utc')::date),
  used int not null default 0 check (used >= 0),
  primary key (user_id, kind, day)
);
alter table ai_allowance enable row level security;

-- Atomically spend one of today's (UTC) free uses. Returns the new count, or
-- null when the user already used p_limit today.
create or replace function consume_daily_allowance(p_user uuid, p_kind text, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  insert into ai_allowance (user_id, kind, day, used)
  values (p_user, p_kind, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, kind, day) do update
    set used = ai_allowance.used + 1
    where ai_allowance.used < p_limit
  returning used into n;
  return n;
end $$;

revoke execute on function consume_daily_allowance(uuid, text, int) from public, anon, authenticated;
grant execute on function consume_daily_allowance(uuid, text, int) to service_role;
