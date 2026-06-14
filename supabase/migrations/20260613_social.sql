-- Friends & Study Groups
-- Extends player_profiles + the leagues/schools social pattern.

-- ── Profile identity ──────────────────────────────────────────────
alter table player_profiles add column if not exists username text;
alter table player_profiles add column if not exists friend_code text;
create unique index if not exists idx_profiles_username on player_profiles (lower(username));
create unique index if not exists idx_profiles_friend_code on player_profiles (friend_code);

-- ── Friendships (mutual accept) ───────────────────────────────────
create table if not exists friendships (
  id            bigint generated always as identity primary key,
  requester_id  uuid not null references auth.users(id) on delete cascade,
  addressee_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending',   -- pending | accepted
  created_at    timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index if not exists idx_friendships_requester on friendships(requester_id);
create index if not exists idx_friendships_addressee on friendships(addressee_id);

-- ── Study groups (term-scoped) ────────────────────────────────────
create table if not exists study_groups (
  id           bigint generated always as identity primary key,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  school       text,
  invite_code  text not null unique,
  term_start   date not null,
  term_end     date not null,
  status       text not null default 'active',      -- active | archived
  max_members  int  not null default 6,
  created_at   timestamptz not null default now(),
  check (term_end > term_start),
  check (term_end <= term_start + interval '4 months')
);
create index if not exists idx_groups_owner on study_groups(owner_id);
create index if not exists idx_groups_status_end on study_groups(status, term_end);

create table if not exists group_members (
  id                   bigint generated always as identity primary key,
  group_id             bigint not null references study_groups(id) on delete cascade,
  user_id              uuid   not null references auth.users(id) on delete cascade,
  role                 text   not null default 'member',  -- owner | member
  status               text   not null default 'pending', -- pending | active
  focus_minutes_total  int    not null default 0,
  joined_at            timestamptz not null default now(),
  unique (group_id, user_id)
);
create index if not exists idx_group_members_group on group_members(group_id);
create index if not exists idx_group_members_user on group_members(user_id);

create table if not exists group_weekly (
  id            bigint generated always as identity primary key,
  group_id      bigint not null references study_groups(id) on delete cascade,
  user_id       uuid   not null references auth.users(id) on delete cascade,
  week_start    date   not null,
  focus_minutes int    not null default 0,
  unique (group_id, user_id, week_start)
);
create index if not exists idx_group_weekly_group_week on group_weekly(group_id, week_start);

create table if not exists group_trees (
  id         bigint generated always as identity primary key,
  group_id   bigint not null references study_groups(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  tree       jsonb  not null,
  planted_at timestamptz not null default now()
);
create index if not exists idx_group_trees_group on group_trees(group_id);

-- ── RLS ───────────────────────────────────────────────────────────
alter table friendships   enable row level security;
alter table study_groups  enable row level security;
alter table group_members enable row level security;
alter table group_weekly  enable row level security;
alter table group_trees   enable row level security;

-- Helper functions (security definer) to avoid recursive RLS on group_members.
create or replace function public.is_group_member(g bigint)
returns boolean language sql security definer stable set search_path = public as
$$ select exists(select 1 from group_members where group_id = g and user_id = auth.uid()) $$;

create or replace function public.is_active_group_member(g bigint)
returns boolean language sql security definer stable set search_path = public as
$$ select exists(select 1 from group_members where group_id = g and user_id = auth.uid() and status = 'active') $$;

-- Friendships: a user sees/acts on rows where they are a party.
create policy friendships_select on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_insert on friendships for insert
  with check (auth.uid() = requester_id);
create policy friendships_update on friendships for update
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy friendships_delete on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Groups: members read their groups; owner updates. (Writes go through
-- server routes using the service role, which bypasses RLS.)
create policy groups_select on study_groups for select
  using (public.is_group_member(study_groups.id));
create policy groups_update on study_groups for update
  using (auth.uid() = owner_id);

create policy group_members_select on group_members for select
  using (public.is_group_member(group_members.group_id));

create policy group_weekly_select on group_weekly for select
  using (public.is_active_group_member(group_weekly.group_id));

create policy group_trees_select on group_trees for select
  using (public.is_active_group_member(group_trees.group_id));
