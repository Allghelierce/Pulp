-- Weekly leagues system
-- Each league has 50 players competing on focus minutes per week

create table if not exists leagues (
  id bigint generated always as identity primary key,
  tier text not null default 'bronze', -- bronze, silver, gold, platinum, diamond
  week_start date not null, -- Monday of the competition week
  created_at timestamptz not null default now()
);

create table if not exists league_members (
  id bigint generated always as identity primary key,
  league_id bigint not null references leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'anonymous',
  avatar_color text not null default '#d97706',
  level int not null default 1,
  focus_minutes int not null default 0,
  trees_grown int not null default 0,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create index idx_league_members_user on league_members(user_id);
create index idx_league_members_league on league_members(league_id);
create index idx_leagues_week on leagues(week_start);

-- Track which tier a user belongs to (persists across weeks)
create table if not exists league_standings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_tier text not null default 'bronze',
  current_league_id bigint references leagues(id),
  total_weeks int not null default 0,
  best_tier text not null default 'bronze',
  last_reward_week date,
  updated_at timestamptz not null default now()
);

-- Weekly rewards log
create table if not exists league_rewards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  tier text not null,
  placement int not null,
  gems_awarded int not null default 0,
  awarded_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Atomically increment a member's focus minutes
create or replace function increment_league_focus(
  p_league_id bigint,
  p_user_id uuid,
  p_minutes int
) returns void as $$
begin
  update league_members
  set focus_minutes = focus_minutes + p_minutes
  where league_id = p_league_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;
