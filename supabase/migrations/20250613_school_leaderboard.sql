-- School competition leaderboard
-- Students compete within their own school, ranked by pulp (sap) gained per week.

-- Which school a player belongs to (chosen in profile).
alter table player_profiles add column if not exists school text;

-- Per-week pulp snapshot for each player. delta = pulp_current - pulp_start.
create table if not exists pulp_weekly (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,            -- Monday of the competition week
  school text not null,
  display_name text not null default 'Writer',
  avatar_color text not null default '#d97706',
  level int not null default 1,
  trees_grown int not null default 0,
  pulp_start int not null default 0,   -- sap at first report this week
  pulp_current int not null default 0, -- latest reported sap
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_pulp_weekly_school_week on pulp_weekly(school, week_start);
create index if not exists idx_pulp_weekly_user on pulp_weekly(user_id);

-- Applications to add a new (unlisted) school. Reviewed before becoming joinable.
create table if not exists school_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  school_name text not null,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamptz not null default now(),
  unique (user_id, school_name)
);

create index if not exists idx_school_applications_status on school_applications(status);
