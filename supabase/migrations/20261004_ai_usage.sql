-- Per-user daily AI request counter. Caps spend on paid AI providers (Groq, HF).
-- Only the service role touches this table (RLS on, no policies).
create table if not exists ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null default ((now() at time zone 'utc')::date),
  requests int not null default 0,
  primary key (user_id, day)
);
alter table ai_usage enable row level security;

-- Atomically count one request. Returns the new count, or null when the user
-- is already at p_limit for today (UTC).
create or replace function consume_ai_quota(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  insert into ai_usage (user_id, day, requests)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set requests = ai_usage.requests + 1
    where ai_usage.requests < p_limit
  returning requests into n;
  return n;
end $$;

revoke execute on function consume_ai_quota(uuid, int) from public, anon, authenticated;
grant execute on function consume_ai_quota(uuid, int) to service_role;
