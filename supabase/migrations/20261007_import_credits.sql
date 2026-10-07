-- Note import: free accounts get a lifetime pool of AI-carded import sections
-- (IMPORT_FREE_TOPICS, default 12). Pro has no lifetime cap (daily AI cap still applies).
alter table player_profiles add column if not exists import_topics_used int not null default 0;
alter table player_profiles drop constraint if exists player_profiles_import_topics_used_nonneg;
alter table player_profiles add constraint player_profiles_import_topics_used_nonneg check (import_topics_used >= 0);
alter table player_profiles add column if not exists ai_free_used int not null default 0;
alter table player_profiles add column if not exists pro_access boolean not null default false;
alter table player_profiles add column if not exists pro_expires_at timestamptz;

-- The client writes its own player_profiles row with the anon key + user JWT
-- (upsert from lib/db.ts etc.), and RLS lets it. Without this, a free user could
-- reset import_topics_used / ai_free_used or grant themselves pro_access from
-- devtools. Server-owned columns are only writable by service_role (our API
-- routes + Stripe webhook) or a direct DB session (no JWT, e.g. SQL editor);
-- any client write silently keeps the old values (defaults on insert).
create or replace function protect_player_profile_server_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.import_topics_used := 0;
      new.ai_free_used := 0;
      new.pro_access := false;
      new.pro_expires_at := null;
      new.stripe_customer_id := null;
    else
      new.import_topics_used := coalesce(old.import_topics_used, 0);
      new.ai_free_used := coalesce(old.ai_free_used, 0);
      new.pro_access := coalesce(old.pro_access, false);
      new.pro_expires_at := old.pro_expires_at;
      new.stripe_customer_id := old.stripe_customer_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_player_profile_server_columns on player_profiles;
create trigger protect_player_profile_server_columns
  before insert or update on player_profiles
  for each row execute function protect_player_profile_server_columns();

-- Atomically spend one import credit. Returns the new count, or null when the
-- user has already used p_limit (or has no profile row).
create or replace function consume_import_topic(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update player_profiles set import_topics_used = import_topics_used + 1
    where user_id = p_user and import_topics_used < p_limit
    returning import_topics_used into n;
  return n;
end $$;

-- Give one credit back (AI call failed / produced nothing). Never goes below 0.
create or replace function refund_import_topic(p_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update player_profiles set import_topics_used = greatest(import_topics_used - 1, 0)
    where user_id = p_user
    returning import_topics_used into n;
  return n;
end $$;

revoke execute on function consume_import_topic(uuid, int) from public, anon, authenticated;
grant execute on function consume_import_topic(uuid, int) to service_role;
revoke execute on function refund_import_topic(uuid) from public, anon, authenticated;
grant execute on function refund_import_topic(uuid) to service_role;
