# Friends & Study Groups — Design

**Date:** 2026-06-13
**Status:** Approved (design), pending implementation plan

## Summary

Add a social layer to Pulp: a **friends** system and a **study-group** system where
members co-focus in live rooms and grow a shared *communal grove* together, while
competing on focus minutes inside the group.

The design deliberately avoids a fully-shared *mutable* grove (no two users writing the
same land at once). Instead each member's focus session still plants into their **own**
grove (reusing all existing timer/grove/sap machinery), and a tagged copy of that tree is
recorded against the group to render an aggregate **communal grove**. This delivers the
"we built this together" feeling without a real-time collaborative-editing engine.

## Goals

- Friends: claim a unique username, add friends by friend-code or @username, mutual accept.
- Study groups: create/join (invite code → owner-approved request), cap 6 members.
- Co-focus rooms: live presence (who's online / focusing, timers ticking) via Supabase Realtime.
- Communal grove: trees grown during group sessions aggregate into one group grove view.
- Competition: weekly focus-minute leaderboard (resets Monday) over all-time-this-term totals.
- Contribution list: see who has done more (minutes + trees).
- Term lifecycle: owner sets term dates (≤ 4 months); group auto-archives at term end (read-only).

## Non-goals (v1)

- Fully shared **mutable** grove (everyone planting/watering/collecting the same land live). *Future.*
- Public/searchable group discovery. v1 is invite-code only. *Future.*
- In-group chat / messaging. *Future.*
- School-calendar **auto** term dates. v1 owner sets dates manually. *Future.*
- Blocking / moderation tooling beyond owner approve/remove. *Future.*

## Decisions (from brainstorming)

| Question | Decision |
| --- | --- |
| What "work on groves together" means | Hybrid: co-focus rooms + communal **aggregate** grove (not shared-mutable) |
| Add a friend | Friend code/link **and** @username search; users set a unique username |
| Friend request model | Mutual (request → accept) |
| Join a group | Invite code/link → join request → **owner approves** |
| Group member cap | 6 |
| Room liveness | **Live presence** (Supabase Realtime) |
| In-group rank metric | **Focus minutes** |
| Competition timeframe | Weekly (resets Mon) + all-time-this-term |
| Term lifecycle | Group is term-scoped; auto-archives read-only at term end |
| Term dates source | v1: **owner sets manually, cap 4 months**. Auto-from-school later. |
| School | Chosen at signup; powers discovery + existing school leaderboard, not dates (yet) |

## Architecture

### Data model (Supabase / Postgres, snake_case, RLS on, references `auth.users`)

Follows existing patterns in `lib/db.ts` + `supabase/migrations/` (see `20250514_leagues.sql`,
`20250613_school_leaderboard.sql`).

**Extend `player_profiles`:**
- `username text unique` — claimed handle (case-insensitive uniqueness; store normalized).
- `friend_code text unique` — short auto-generated code (e.g. `PULP-7K2Q`).
- `school text` — already exists.

**`friendships`**
```
id           bigint identity pk
requester_id uuid not null references auth.users(id) on delete cascade
addressee_id uuid not null references auth.users(id) on delete cascade
status       text not null default 'pending'   -- pending | accepted
created_at   timestamptz not null default now()
unique (requester_id, addressee_id)
-- enforce requester_id <> addressee_id; query both directions for a user's friends
```

**`study_groups`**
```
id           bigint identity pk
owner_id     uuid not null references auth.users(id) on delete cascade
name         text not null
school       text                                   -- nullable
invite_code  text not null unique                   -- shareable
term_start   date not null
term_end     date not null                          -- enforced <= term_start + 4 months
status       text not null default 'active'         -- active | archived
max_members  int  not null default 6
created_at   timestamptz not null default now()
```

**`group_members`**
```
id                  bigint identity pk
group_id            bigint not null references study_groups(id) on delete cascade
user_id             uuid   not null references auth.users(id) on delete cascade
role                text   not null default 'member'  -- owner | member
status              text   not null default 'pending' -- pending (awaiting approval) | active
focus_minutes_total int    not null default 0         -- all-time this term
joined_at           timestamptz not null default now()
unique (group_id, user_id)
```

**`group_weekly`** (mirrors `pulp_weekly` / `league_members`)
```
id            bigint identity pk
group_id      bigint not null references study_groups(id) on delete cascade
user_id       uuid   not null references auth.users(id) on delete cascade
week_start    date   not null                      -- Monday
focus_minutes int    not null default 0
unique (group_id, user_id, week_start)
```

**`group_trees`** (the communal grove)
```
id         bigint identity pk
group_id   bigint not null references study_groups(id) on delete cascade
user_id    uuid   not null references auth.users(id) on delete cascade
tree       jsonb  not null                          -- {type, stage, ...} snapshot
planted_at timestamptz not null default now()
```

**Presence:** ephemeral Supabase Realtime channel per group, e.g. `group:{id}`.
Presence payload `{ user_id, display_name, avatar_color, status: 'online'|'focusing', timer_end? }`.
No table — presence is transient.

**Archiving:** set `study_groups.status = 'archived'`. All rows persist; reads gate writes on
`status = 'active'`. No separate archive table.

### Server / API surface

New routes under `app/api/` (auth via existing `lib/supabase-server.ts` + `lib/apiFetch.ts`,
CSRF via existing helpers where mutating):

- Friends: claim username, lookup by username/friend-code, send/accept/decline request, list friends.
- Groups: create, get (with members + standings), join-by-code (creates pending member),
  approve/decline member, leave, list my groups.
- Group session report: on focus-session completion while in a group room, upsert
  `group_weekly`, increment `group_members.focus_minutes_total`, insert `group_trees`.
- Archive sweep: a check (cron or lazy-on-read) that flips groups past `term_end` to `archived`.

`lib/db.ts` gains typed helpers mirroring its existing style (e.g. `getGroup`, `listFriends`,
`reportGroupFocus`).

### Client integration

- **Onboarding:** first-run modal to claim username + pick school (extends existing school field).
- **VitalitySystem** session-completion path (where daily stats / leagues already get logged) gains
  an "active group context" check; if set, it calls the group-report endpoint. The "active group
  context" is the group room the user currently has open/joined when the session completes.
- **New Community tab:** a full-bleed view, sibling of Stats/Shop (same
  `AnimatePresence` fade pattern just added), with two panels:
  - **Friends:** list, pending requests, add-by-code, add-by-username search.
  - **Groups:** my groups, create group, join by code.
- **Group page:** roster + live presence · communal grove (renders `group_trees`, reuses
  `OrchardView`/`PlantIcon`) · weekly + all-time leaderboard · contribution list · invite code ·
  term countdown · archived (read-only) banner when frozen.

## Data flow: a group focus session

1. Member opens a group room → joins Realtime presence channel (`status: online`).
2. Member starts a focus session → presence updates to `focusing` with `timer_end`.
   Other members see the live timer.
3. Session completes in `VitalitySystem`:
   - Tree is planted into the member's **own** grove (existing behavior, unchanged).
   - Because a group context is active, client also reports to the group:
     upsert `group_weekly(+minutes)`, `group_members.focus_minutes_total += minutes`,
     insert `group_trees(tree snapshot)`.
   - The new `group_trees` row broadcasts via Realtime → appears in everyone's communal grove.
4. Leaderboards recompute from `group_weekly` (this week) and `focus_minutes_total` (term).

## Term & archive flow

- Group created with `term_start`/`term_end` (`term_end <= term_start + 4 months`, validated).
- A sweep (cron job and/or lazy check when the group is loaded) flips `status` to `archived`
  once `now() > term_end`.
- Archived group: all reads work; all writes (join, report, plant) are rejected. UI shows a
  read-only banner; members can browse final grove + standings + stats. Continue = create a new
  group for next term (stretch: "continue" clones the active roster).

## Security / RLS

- `player_profiles`: username/friend-code readable for lookup; only owner writes own row.
- `friendships`: a user can read rows where they are requester or addressee; insert as requester;
  update (accept/decline) only as addressee.
- `study_groups` / `group_*`: readable by group members (and by anyone presenting a valid
  invite_code for the join flow); writes gated by membership + `role`/`status` + group `active`.
- All mutations go through server routes that re-check authorization (don't trust client).

## Testing

- Playwright (existing harness): username claim + uniqueness collision; send/accept friend request;
  create group → join by code → owner approves; focus session in a room updates leaderboard +
  communal grove; term-end archive makes the group read-only.
- Unit-ish: term-length validation (≤ 4 months), week_start (Monday) computation, friend-code
  generation/uniqueness.

## Suggested build phases

The plan should sequence this so value lands early and risk is isolated:

1. **Foundations** — `player_profiles` username + friend_code; username/school onboarding modal;
   `lib/db.ts` helpers; migrations + RLS.
2. **Friends** — request/accept, add-by-code, @username search, Friends panel in the Community tab.
3. **Groups (static)** — create/join-by-code/owner-approve, roster, term dates + validation,
   archive sweep, Groups panel + group page shell.
4. **Contributions & competition** — group-report on session completion, `group_weekly` +
   `focus_minutes_total`, weekly/all-time leaderboard, contribution list.
5. **Communal grove** — `group_trees` write + aggregate grove rendering.
6. **Live presence** — Supabase Realtime channel: online/focusing, live timers, trees popping in.

Phases 1–3 are shippable without realtime; phase 6 (Realtime) is the highest-complexity piece and
comes last so the rest isn't blocked on it.

## Open items / future

- Auto term dates from a per-school academic calendar (curated seed + computed fallback, or an
  LLM curation helper that proposes dates for human approval).
- Fully shared mutable grove as an upgrade to the aggregate grove.
- In-group chat, public group discovery, friend-grove visiting, blocking.
