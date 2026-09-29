# Friends & Study Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a friends system and term-scoped study groups where members co-focus in live rooms, grow a shared communal grove, and compete on focus minutes.

**Architecture:** Postgres/Supabase tables extend the existing `player_profiles` + leagues pattern. Each focus session still plants into the member's own grove (unchanged); when a group room is active, the session is also *reported* to the group (weekly minutes, all-time total, and a tagged tree copy for the aggregate communal grove). Live presence is an ephemeral Supabase Realtime channel per group. A new full-bleed "Community" tab (sibling of Stats/Shop) hosts Friends + Groups.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (`@supabase/supabase-js`, Realtime), Framer Motion, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-13-friends-and-study-groups-design.md`

---

## File Structure

**New backend**
- `supabase/migrations/20260613_social.sql` — schema + RLS for the whole feature.
- `lib/social.ts` — pure helpers (friend-code/invite-code generation, term-length validation, reuses `getWeekStart`).
- `lib/db.ts` — add typed query helpers (friends, groups, reporting) following existing style.
- `app/api/profile/username/route.ts` — claim/validate username.
- `app/api/friends/route.ts` — list / send / accept / decline / lookup.
- `app/api/groups/route.ts` — create / list / get.
- `app/api/groups/membership/route.ts` — join-by-code / approve / decline / leave.
- `app/api/groups/report/route.ts` — report a completed focus session to a group.

**New frontend**
- `app/components/CommunityView.tsx` — full-bleed tab shell with Friends + Groups panels.
- `app/components/community/FriendsPanel.tsx`
- `app/components/community/GroupsPanel.tsx`
- `app/components/community/GroupPage.tsx` — roster, presence, communal grove, leaderboard, contributions.
- `app/components/community/useGroupPresence.ts` — Realtime presence hook.
- `app/components/OnboardingModal.tsx` — username + school first-run.

**Modified**
- `app/app/page.tsx` — `communityOpen` state, nav button, AnimatePresence-wrapped render (matches the Stats/Shop pattern).
- `app/components/VitalitySystem.tsx` — report to active group on session completion.
- `app/components/Sidebar.tsx` (or `RightSidebar.tsx`) — entry point button to open Community.

**Tests**
- `tests/social/*.spec.ts` — Playwright e2e for username claim, friend request, group create/join/approve, session→leaderboard, archive read-only.

---

## Conventions to follow (from the existing codebase)

- API routes: `getAuthUser(req)` (Bearer) → `supabaseAdmin` for writes; rate-limit with `getRateLimitKey`/`checkRateLimit`; shape `NextResponse.json({...}, {status})`. Pattern reference: `app/api/league/route.ts`, `app/api/school-application/route.ts`.
- Client calls: `apiFetch(url, { method, body: JSON.stringify(...) })` (injects the Bearer token).
- Week math: import `getWeekStart` from `lib/leagues.ts` (Monday-based, `YYYY-MM-DD`).
- Full-bleed tab render: wrap in `<AnimatePresence>` + `<m.div initial/animate/exit opacity>` exactly like the Stats/Shop blocks already in `app/app/page.tsx`.
- Accent `#d97706`; EB Garamond / Crimson Pro for UI; inline styles for dynamic values; `memo()` components.

---

### Task 0: Social schema migration + RLS

**Goal:** Create all social tables and the `player_profiles` columns, with row-level security.

**Files:**
- Create: `supabase/migrations/20260613_social.sql`

**Acceptance Criteria:**
- [ ] Migration adds `username`, `friend_code` (both unique, nullable) to `player_profiles`.
- [ ] Tables `friendships`, `study_groups`, `group_members`, `group_weekly`, `group_trees` exist with the columns from the spec and the listed indexes.
- [ ] `term_end <= term_start + interval '4 months'` enforced by a CHECK constraint.
- [ ] RLS enabled on every new table with the policies below.
- [ ] File is valid SQL (applies cleanly in Supabase SQL editor / `supabase db push`).

**Verify:** Apply in the Supabase SQL editor (or `supabase db push`) → no errors; `select * from study_groups limit 1;` succeeds.

**Steps:**

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260613_social.sql`:

```sql
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

-- Friendships: a user sees/acts on rows where they are a party.
create policy friendships_select on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_insert on friendships for insert
  with check (auth.uid() = requester_id);
create policy friendships_update on friendships for update
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy friendships_delete on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Groups: members read their groups; owner updates. (Join-by-code is a
-- server route using the service role, so no anon insert policy needed.)
create policy groups_select on study_groups for select
  using (exists (select 1 from group_members m
                 where m.group_id = study_groups.id and m.user_id = auth.uid()));
create policy groups_update on study_groups for update
  using (auth.uid() = owner_id);

create policy group_members_select on group_members for select
  using (exists (select 1 from group_members m
                 where m.group_id = group_members.group_id and m.user_id = auth.uid()));

create policy group_weekly_select on group_weekly for select
  using (exists (select 1 from group_members m
                 where m.group_id = group_weekly.group_id and m.user_id = auth.uid() and m.status = 'active'));

create policy group_trees_select on group_trees for select
  using (exists (select 1 from group_members m
                 where m.group_id = group_trees.group_id and m.user_id = auth.uid() and m.status = 'active'));
```

> Note: all *writes* to groups/members/weekly/trees go through server routes using `supabaseAdmin` (service role bypasses RLS), so we intentionally only define SELECT/owner-UPDATE policies here. This mirrors how `app/api/league/route.ts` writes with the admin client.

- [ ] **Step 2: Apply and verify**

Apply the file in the Supabase SQL editor (or `supabase db push` if the CLI is linked). Confirm no errors and run `select count(*) from group_members;` → returns `0`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260613_social.sql
git commit -m "feat(social): friends + study groups schema and RLS"
```

---

### Task 1: Social utilities + db helpers

**Goal:** Pure helpers for code generation and term validation, plus typed Supabase query helpers used by the API routes.

**Files:**
- Create: `lib/social.ts`
- Modify: `lib/db.ts` (append a "Social" section)

**Acceptance Criteria:**
- [ ] `generateFriendCode()` returns `PULP-XXXX` (4 unambiguous base32 chars).
- [ ] `generateInviteCode()` returns an 8-char unambiguous code.
- [ ] `validateUsername(name)` returns `{ ok: true, value }` for 3–20 chars `[a-z0-9_]` (lowercased), else `{ ok: false, error }`.
- [ ] `validateTerm(start, end)` rejects `end <= start` and `end > start + 4 months`.
- [ ] `lib/db.ts` exports the helpers listed in Step 2 and `npx tsc --noEmit` passes.

**Verify:** `npx tsc --noEmit` → no errors. Then `node -e "const s=require('./.next-tsnode-skip');"` is not needed — type-check is the gate.

**Steps:**

- [ ] **Step 1: Create `lib/social.ts`**

```ts
// Pure helpers for the social (friends + study groups) feature.
export const FRIEND_CODE_PREFIX = 'PULP-'

// Unambiguous base32 alphabet (no 0/O/1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function generateFriendCode(): string {
  return FRIEND_CODE_PREFIX + randomCode(4)
}

export function generateInviteCode(): string {
  return randomCode(8)
}

export type UsernameResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function validateUsername(raw: string): UsernameResult {
  const value = (raw ?? '').trim().toLowerCase()
  if (value.length < 3) return { ok: false, error: 'Username must be at least 3 characters' }
  if (value.length > 20) return { ok: false, error: 'Username must be 20 characters or fewer' }
  if (!/^[a-z0-9_]+$/.test(value)) return { ok: false, error: 'Use only letters, numbers, and underscores' }
  return { ok: true, value }
}

const FOUR_MONTHS_MS = 4 * 31 * 24 * 60 * 60 * 1000

export type TermResult = { ok: true } | { ok: false; error: string }

export function validateTerm(startISO: string, endISO: string): TermResult {
  const start = new Date(startISO).getTime()
  const end = new Date(endISO).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return { ok: false, error: 'Invalid dates' }
  if (end <= start) return { ok: false, error: 'Term end must be after start' }
  if (end - start > FOUR_MONTHS_MS) return { ok: false, error: 'Term cannot exceed 4 months' }
  return { ok: true }
}
```

- [ ] **Step 2: Append social helpers to `lib/db.ts`**

Add at the end of `lib/db.ts`:

```ts
// ─── Social: friends ───
export interface PublicProfile {
  user_id: string
  username: string | null
  friend_code: string | null
  display_name?: string
  avatar_color?: string
  level?: number
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('player_profiles')
    .select('user_id, username, friend_code')
    .ilike('username', username)
    .single()
  return data
}

export async function getProfileByFriendCode(code: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('player_profiles')
    .select('user_id, username, friend_code')
    .eq('friend_code', code)
    .single()
  return data
}

// ─── Social: groups ───
export interface StudyGroup {
  id: number
  owner_id: string
  name: string
  school: string | null
  invite_code: string
  term_start: string
  term_end: string
  status: 'active' | 'archived'
  max_members: number
}

export interface GroupMember {
  group_id: number
  user_id: string
  role: 'owner' | 'member'
  status: 'pending' | 'active'
  focus_minutes_total: number
}

export async function getMyGroups(userId: string): Promise<StudyGroup[]> {
  const { data } = await supabase
    .from('group_members')
    .select('study_groups(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
  return (data ?? []).map((r: any) => r.study_groups).filter(Boolean)
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add lib/social.ts lib/db.ts
git commit -m "feat(social): code generation, validation, and db helpers"
```

---

### Task 2: Username + school onboarding

**Goal:** First-run modal to claim a unique username and pick a school; backed by a claim endpoint that also assigns a friend code.

**Files:**
- Create: `app/api/profile/username/route.ts`
- Create: `app/components/OnboardingModal.tsx`
- Modify: `app/app/page.tsx` (render the modal when the profile has no username)

**Acceptance Criteria:**
- [ ] `POST /api/profile/username` validates the username, rejects duplicates (409), assigns a `friend_code` if missing, sets `school`, returns `{ username, friend_code }`.
- [ ] Modal blocks until a username is claimed; school uses the existing `SCHOOLS` list with a custom-entry option.
- [ ] Re-opening the app after claiming does not show the modal again.

**Verify:** Playwright `tests/social/onboarding.spec.ts` → claim a username, reload, modal absent.

**Steps:**

- [ ] **Step 1: Create the route**

`app/api/profile/username/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { validateUsername, generateFriendCode } from "@/lib/social"

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`username:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const v = validateUsername(body.username ?? '')
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
  const school = typeof body.school === 'string' ? body.school.trim().slice(0, 80) : null

  // Uniqueness (case-insensitive) excluding self.
  const { data: existing } = await supabaseAdmin
    .from('player_profiles')
    .select('user_id')
    .ilike('username', v.value)
    .maybeSingle()
  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Username taken" }, { status: 409 })
  }

  // Ensure a friend code (generate-and-retry on the rare unique collision).
  const { data: current } = await supabaseAdmin
    .from('player_profiles').select('friend_code').eq('user_id', user.id).single()
  let friendCode = current?.friend_code as string | null
  if (!friendCode) {
    for (let attempt = 0; attempt < 5 && !friendCode; attempt++) {
      const candidate = generateFriendCode()
      const { error } = await supabaseAdmin.from('player_profiles')
        .update({ friend_code: candidate }).eq('user_id', user.id)
      if (!error) friendCode = candidate
    }
  }

  const { error } = await supabaseAdmin.from('player_profiles')
    .update({ username: v.value, school }).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })

  return NextResponse.json({ username: v.value, friend_code: friendCode })
}
```

- [ ] **Step 2: Create `app/components/OnboardingModal.tsx`**

```tsx
"use client"
import { useState, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"

const accent = '#d97706'

export const OnboardingModal = memo(function OnboardingModal({
  theme, onDone,
}: { theme: "light" | "dark"; onDone: (r: { username: string; friend_code: string }) => void }) {
  const [username, setUsername] = useState("")
  const [school, setSchool] = useState(SCHOOLS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const submit = async () => {
    setBusy(true); setError(null)
    const res = await apiFetch('/api/profile/username', {
      method: 'POST', body: JSON.stringify({ username, school }),
    })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) { setError(json.error || 'Could not save'); return }
    onDone(json)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: 360, padding: 28, borderRadius: 20, fontFamily: 'Crimson Pro, serif',
        background: isDark ? '#18181b' : '#fdfcf9', border: `1px solid ${isDark ? '#27272a' : '#e7e2d8'}` }}>
        <h2 style={{ fontSize: 22, margin: '0 0 4px', color: isDark ? '#fafafa' : '#0f0f10' }}>Claim your name</h2>
        <p style={{ fontSize: 14, color: '#8a857e', margin: '0 0 18px' }}>Pick a username and your school.</p>
        <input
          autoFocus value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="username"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 12,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, outline: 'none',
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}
        />
        <select value={school} onChange={e => setSchool(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 16,
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`,
            background: isDark ? '#0e0c09' : '#fff', color: isDark ? '#fafafa' : '#0f0f10' }}>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button onClick={submit} disabled={busy || username.trim().length < 3}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: accent, color: '#fff', fontFamily: 'Crimson Pro, serif', fontSize: 15,
            opacity: busy || username.trim().length < 3 ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
})
```

- [ ] **Step 3: Render in `app/app/page.tsx`**

Add state near the other panel state (`const [communityOpen, ...]` will come in Task 3); for now add:

```tsx
const [needsOnboarding, setNeedsOnboarding] = useState(false)
const [friendCode, setFriendCode] = useState<string | null>(null)
```

After the profile loads (where `player_profiles` is read on sign-in), set `setNeedsOnboarding(!profile.username)` and `setFriendCode(profile.friend_code)`. Then render before `</LazyMotion>`:

```tsx
{needsOnboarding && user && (
  <OnboardingModal theme={theme} onDone={(r) => { setFriendCode(r.friend_code); setNeedsOnboarding(false) }} />
)}
```

Import: `import { OnboardingModal } from "@/app/components/OnboardingModal"`.

- [ ] **Step 4: Playwright test**

`tests/social/onboarding.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('user claims a username and it persists', async ({ page }) => {
  await page.goto('/app')
  const modal = page.getByText('Claim your name')
  await expect(modal).toBeVisible()
  await page.getByPlaceholder('username').fill('testuser_' + Date.now().toString().slice(-5))
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(modal).toBeHidden()
  await page.reload()
  await expect(page.getByText('Claim your name')).toBeHidden()
})
```

> The test assumes an authenticated session fixture exists (the repo's other e2e specs establish one); reuse that fixture. If none exists, gate this test behind the same auth setup used by existing specs.

- [ ] **Step 5: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

```bash
git add app/api/profile/username/route.ts app/components/OnboardingModal.tsx app/app/page.tsx tests/social/onboarding.spec.ts
git commit -m "feat(social): username + school onboarding"
```

---

### Task 3: Community tab shell + nav wiring

**Goal:** A full-bleed Community view (sibling of Stats/Shop) with empty Friends + Groups panels, opened from a nav button, using the same AnimatePresence fade.

**Files:**
- Create: `app/components/CommunityView.tsx`
- Create: `app/components/community/FriendsPanel.tsx` (stub)
- Create: `app/components/community/GroupsPanel.tsx` (stub)
- Modify: `app/app/page.tsx` (state, render, close-on-escape via component, nav button)

**Acceptance Criteria:**
- [ ] A "Community" button opens the view; it fades in/out like Stats/Shop.
- [ ] The view has two tabs: Friends and Groups (empty for now); Escape closes it.
- [ ] Opening Community runs through `closeAllPanels()` so it's mutually exclusive with Stats/Shop/etc.

**Verify:** `tests/social/community-tab.spec.ts` → open Community, see Friends/Groups tabs, press Escape, view hidden.

**Steps:**

- [ ] **Step 1: Create stub panels**

`app/components/community/FriendsPanel.tsx`:

```tsx
"use client"
import { memo } from "react"
export const FriendsPanel = memo(function FriendsPanel({ theme, friendCode }: { theme: "light" | "dark"; friendCode: string | null }) {
  return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', color: theme === 'dark' ? '#fafafa' : '#0f0f10' }}>Friends — your code: {friendCode ?? '—'}</div>
})
```

`app/components/community/GroupsPanel.tsx`:

```tsx
"use client"
import { memo } from "react"
export const GroupsPanel = memo(function GroupsPanel({ theme }: { theme: "light" | "dark" }) {
  return <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', color: theme === 'dark' ? '#fafafa' : '#0f0f10' }}>Groups</div>
})
```

- [ ] **Step 2: Create `app/components/CommunityView.tsx`**

```tsx
"use client"
import { useState, useEffect, memo } from "react"
import { FriendsPanel } from "./community/FriendsPanel"
import { GroupsPanel } from "./community/GroupsPanel"

const accent = '#d97706'

export const CommunityView = memo(function CommunityView({
  theme, friendCode, onClose,
}: { theme: "light" | "dark"; friendCode: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<'friends' | 'groups'>('friends')
  const isDark = theme === 'dark'

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const bg = isDark ? '#0e0c09' : '#ede6d8'
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', fontFamily: 'Crimson Pro, serif' }}>
        {(['friends', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: tab === t ? accent : 'transparent', color: tab === t ? '#fff' : (isDark ? '#a1a1aa' : '#6b6864') }}>
            {t}
          </button>
        ))}
        <button onClick={onClose} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: isDark ? '#a1a1aa' : '#6b6864' }}>Close</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'friends' ? <FriendsPanel theme={theme} friendCode={friendCode} /> : <GroupsPanel theme={theme} />}
      </div>
    </div>
  )
})
```

- [ ] **Step 3: Wire into `app/app/page.tsx`**

Add state with the other panels:

```tsx
const [communityOpen, setCommunityOpen] = useState(false)
```

Add `setCommunityOpen(false)` inside `closeAllPanels` and add `communityOpen` to the `fullscreenOpenRef` / `hidden` expressions alongside `statsOpen` etc. Render next to the Stats block:

```tsx
<AnimatePresence>
  {communityOpen && (
    <m.div key="community-view"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: sidebarWidth > 40 ? 72 : 0, zIndex: 50 }}>
      <CommunityView theme={theme} friendCode={friendCode}
        onClose={() => setCommunityOpen(false)} />
    </m.div>
  )}
</AnimatePresence>
```

Add a nav entry point (in the sidebar, near Stats/Shop/Leaderboard open handlers):

```tsx
onOpenCommunity={() => { if (communityOpen) { setCommunityOpen(false) } else { startTransition(() => { closeAllPanels(); setCommunityOpen(true) }) } }}
```

Wire that prop through to the existing sidebar component's button list (mirror the `onOpenLeaderboard` button). Import: `import { CommunityView } from "@/app/components/CommunityView"`.

- [ ] **Step 4: Test, verify, commit**

`tests/social/community-tab.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
test('community tab opens and closes', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: /community/i }).click()
  await expect(page.getByRole('button', { name: 'friends' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'friends' })).toBeHidden()
})
```

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/components/CommunityView.tsx app/components/community/ app/app/page.tsx tests/social/community-tab.spec.ts
git commit -m "feat(social): community tab shell + nav"
```

---

### Task 4: Friends API

**Goal:** One route handling friend list, send-request (by username or friend code), accept, decline.

**Files:**
- Create: `app/api/friends/route.ts`

**Acceptance Criteria:**
- [ ] `GET` returns `{ friends: [...], incoming: [...], outgoing: [...] }` (accepted, pending-to-me, pending-from-me) with each side's username/level/avatar.
- [ ] `POST {action:'request', username?|friend_code?}` resolves the target, rejects self-add and duplicates, inserts `pending`.
- [ ] `POST {action:'accept'|'decline', friendshipId}` only the addressee can act; accept sets `accepted`, decline deletes the row.
- [ ] Reverse-direction duplicate (they already requested you) is upgraded to `accepted` instead of erroring.

**Verify:** `tests/social/friends.spec.ts` (two browser contexts) → A requests B by code, B accepts, both see each other in `friends`.

**Steps:**

- [ ] **Step 1: Create `app/api/friends/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

// Hydrate a set of user_ids into public profile cards.
async function profiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, any>
  const { data } = await supabaseAdmin
    .from('player_profiles')
    .select('user_id, username, level, friend_code')
    .in('user_id', ids)
  const map: Record<string, any> = {}
  for (const p of data ?? []) map[p.user_id] = p
  return map
}

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`friends-get:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: rows } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const all = rows ?? []
  const otherId = (r: any) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)
  const ids = Array.from(new Set(all.map(otherId)))
  const pmap = await profiles(ids)

  const friends = all.filter(r => r.status === 'accepted')
    .map(r => ({ friendshipId: r.id, ...pmap[otherId(r)] }))
  const incoming = all.filter(r => r.status === 'pending' && r.addressee_id === user.id)
    .map(r => ({ friendshipId: r.id, ...pmap[r.requester_id] }))
  const outgoing = all.filter(r => r.status === 'pending' && r.requester_id === user.id)
    .map(r => ({ friendshipId: r.id, ...pmap[r.addressee_id] }))

  return NextResponse.json({ friends, incoming, outgoing })
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`friends-post:${ip}`, { maxRequests: 20, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (body.action === 'request') {
    // Resolve target by friend_code or username.
    let target: any = null
    if (typeof body.friend_code === 'string') {
      const { data } = await supabaseAdmin.from('player_profiles')
        .select('user_id').eq('friend_code', body.friend_code.trim()).maybeSingle()
      target = data
    } else if (typeof body.username === 'string') {
      const { data } = await supabaseAdmin.from('player_profiles')
        .select('user_id').ilike('username', body.username.trim()).maybeSingle()
      target = data
    }
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (target.user_id === user.id) return NextResponse.json({ error: "That's you" }, { status: 400 })

    // If they already requested me, accept instead.
    const { data: reverse } = await supabaseAdmin.from('friendships')
      .select('id').eq('requester_id', target.user_id).eq('addressee_id', user.id).maybeSingle()
    if (reverse) {
      await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', reverse.id)
      return NextResponse.json({ ok: true, status: 'accepted' })
    }

    const { error } = await supabaseAdmin.from('friendships')
      .upsert({ requester_id: user.id, addressee_id: target.user_id, status: 'pending' },
              { onConflict: 'requester_id,addressee_id' })
    if (error) return NextResponse.json({ error: "Could not send" }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  if (body.action === 'accept' || body.action === 'decline') {
    const { data: row } = await supabaseAdmin.from('friendships')
      .select('*').eq('id', body.friendshipId).single()
    if (!row || row.addressee_id !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    if (body.action === 'accept') {
      await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', row.id)
    } else {
      await supabaseAdmin.from('friendships').delete().eq('id', row.id)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
```

- [ ] **Step 2: Playwright test** (`tests/social/friends.spec.ts`) — two contexts, A requests B by code, B accepts, assert both appear in `GET /api/friends` (call via `page.request` with the stored token, or assert via the UI built in Task 5). Use the repo's two-user auth fixtures.

- [ ] **Step 3: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/api/friends/route.ts tests/social/friends.spec.ts
git commit -m "feat(social): friends request/accept API"
```

---

### Task 5: Friends panel UI

**Goal:** Replace the FriendsPanel stub with a working list: your friend code, add-by-code/username, incoming/outgoing requests, friends list.

**Files:**
- Modify: `app/components/community/FriendsPanel.tsx`

**Acceptance Criteria:**
- [ ] Shows the user's friend code with a copy button.
- [ ] An input + "Add" sends a request by code (auto-detects `PULP-` prefix) or username.
- [ ] Incoming requests render Accept/Decline; accepting moves them into Friends.
- [ ] Lists load from `GET /api/friends` and refresh after each action.

**Verify:** `tests/social/friends.spec.ts` extended to drive the UI: A adds B's code, B sees the request and accepts, B's friends list shows A.

**Steps:**

- [ ] **Step 1: Implement the panel**

```tsx
"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Card { friendshipId: number; user_id: string; username: string | null; level?: number }

export const FriendsPanel = memo(function FriendsPanel({ theme, friendCode }: { theme: "light" | "dark"; friendCode: string | null }) {
  const isDark = theme === 'dark'
  const [friends, setFriends] = useState<Card[]>([])
  const [incoming, setIncoming] = useState<Card[]>([])
  const [outgoing, setOutgoing] = useState<Card[]>([])
  const [input, setInput] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch('/api/friends')
    if (res.ok) { const j = await res.json(); setFriends(j.friends); setIncoming(j.incoming); setOutgoing(j.outgoing) }
  }, [])
  useEffect(() => { load() }, [load])

  const add = async () => {
    const val = input.trim()
    if (!val) return
    const body = val.toUpperCase().startsWith('PULP-') ? { action: 'request', friend_code: val.toUpperCase() } : { action: 'request', username: val }
    const res = await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify(body) })
    const j = await res.json()
    setMsg(res.ok ? (j.status === 'accepted' ? 'Friend added!' : 'Request sent') : (j.error || 'Failed'))
    setInput(""); load()
  }
  const act = async (friendshipId: number, action: 'accept' | 'decline') => {
    await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify({ action, friendshipId }) })
    load()
  }

  const text = isDark ? '#fafafa' : '#0f0f10'
  const sub = '#8a857e'
  const card = (c: Card, right: React.ReactNode) => (
    <div key={c.friendshipId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', marginBottom: 6 }}>
      <span style={{ color: text }}>@{c.username ?? 'writer'}</span>
      <span style={{ color: sub, fontSize: 12 }}>lvl {c.level ?? 1}</span>
      <span style={{ marginLeft: 'auto' }}>{right}</span>
    </div>
  )

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 18, color: sub }}>Your code:{' '}
        <button onClick={() => friendCode && navigator.clipboard.writeText(friendCode)}
          style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>{friendCode ?? '—'} ⧉</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="friend code or @username"
          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, outline: 'none',
            border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text }} />
        <button onClick={add} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>Add</button>
      </div>
      {msg && <p style={{ color: sub, fontSize: 13, margin: '0 0 12px' }}>{msg}</p>}

      {incoming.length > 0 && <h3 style={{ color: text, fontSize: 15, margin: '14px 0 8px' }}>Requests</h3>}
      {incoming.map(c => card(c, <>
        <button onClick={() => act(c.friendshipId, 'accept')} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', marginRight: 8 }}>Accept</button>
        <button onClick={() => act(c.friendshipId, 'decline')} style={{ color: sub, border: 'none', background: 'none', cursor: 'pointer' }}>Decline</button>
      </>))}

      <h3 style={{ color: text, fontSize: 15, margin: '14px 0 8px' }}>Friends ({friends.length})</h3>
      {friends.map(c => card(c, null))}
      {outgoing.map(c => card(c, <span style={{ color: sub, fontSize: 12 }}>pending</span>))}
    </div>
  )
})
```

- [ ] **Step 2: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/components/community/FriendsPanel.tsx tests/social/friends.spec.ts
git commit -m "feat(social): friends panel UI"
```

---

### Task 6: Groups API + archive sweep

**Goal:** Routes for create/list/get groups and for membership (join-by-code, approve, decline, leave), with lazy archive when a group's term has ended.

**Files:**
- Create: `app/api/groups/route.ts`
- Create: `app/api/groups/membership/route.ts`

**Acceptance Criteria:**
- [ ] `POST /api/groups {name, term_start, term_end, school?}` validates the term (≤ 4 months), generates a unique invite code, inserts the group + an `active` owner membership; returns the group.
- [ ] `GET /api/groups` lists the caller's active memberships' groups; lazily flips any past-term group to `archived`.
- [ ] `GET /api/groups?id=` returns the group + active members (with username/level/focus_minutes_total) when the caller is an active member.
- [ ] `POST /api/groups/membership {action:'join', invite_code}` creates a `pending` membership (rejects when full or archived).
- [ ] `{action:'approve'|'decline', groupId, userId}` owner-only; approve sets `active` (enforcing the 6 cap), decline deletes the pending row.
- [ ] `{action:'leave', groupId}` removes the caller (owner cannot leave their own group → 400).

**Verify:** `tests/social/groups.spec.ts` → owner creates a group, second user joins by code, owner approves, both listed as active.

**Steps:**

- [ ] **Step 1: Create `app/api/groups/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { generateInviteCode, validateTerm } from "@/lib/social"

async function archiveIfExpired(group: any) {
  if (group.status === 'active' && new Date(group.term_end).getTime() < Date.now()) {
    await supabaseAdmin.from('study_groups').update({ status: 'archived' }).eq('id', group.id)
    group.status = 'archived'
  }
  return group
}

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`groups-get:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (id) {
    const { data: membership } = await supabaseAdmin.from('group_members')
      .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
    if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

    const { data: group } = await supabaseAdmin.from('study_groups').select('*').eq('id', id).single()
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await archiveIfExpired(group)

    const { data: members } = await supabaseAdmin.from('group_members')
      .select('user_id, role, status, focus_minutes_total').eq('group_id', id)
    const ids = (members ?? []).map(m => m.user_id)
    const { data: profs } = await supabaseAdmin.from('player_profiles')
      .select('user_id, username, level').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    const pmap: Record<string, any> = {}; for (const p of profs ?? []) pmap[p.user_id] = p
    const hydrated = (members ?? []).map(m => ({ ...m, ...pmap[m.user_id] }))
    return NextResponse.json({ group, members: hydrated })
  }

  const { data: rows } = await supabaseAdmin.from('group_members')
    .select('study_groups(*)').eq('user_id', user.id).eq('status', 'active')
  const groups = await Promise.all((rows ?? []).map((r: any) => archiveIfExpired(r.study_groups)).filter(Boolean))
  return NextResponse.json({ groups })
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`groups-create:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : ''
  if (name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 })
  const term = validateTerm(body.term_start, body.term_end)
  if (!term.ok) return NextResponse.json({ error: term.error }, { status: 400 })

  let group: any = null
  for (let attempt = 0; attempt < 5 && !group; attempt++) {
    const { data, error } = await supabaseAdmin.from('study_groups').insert({
      owner_id: user.id, name, school: body.school ?? null,
      invite_code: generateInviteCode(),
      term_start: body.term_start, term_end: body.term_end,
    }).select().single()
    if (!error) group = data
  }
  if (!group) return NextResponse.json({ error: "Could not create" }, { status: 500 })

  await supabaseAdmin.from('group_members').insert({
    group_id: group.id, user_id: user.id, role: 'owner', status: 'active',
  })
  return NextResponse.json({ group })
}
```

- [ ] **Step 2: Create `app/api/groups/membership/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-membership:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (body.action === 'join') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('*').eq('invite_code', String(body.invite_code || '').trim()).maybeSingle()
    if (!group) return NextResponse.json({ error: "Invalid code" }, { status: 404 })
    if (group.status !== 'active') return NextResponse.json({ error: "Group archived" }, { status: 400 })

    const { count } = await supabaseAdmin.from('group_members')
      .select('id', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'active')
    if ((count ?? 0) >= group.max_members) return NextResponse.json({ error: "Group full" }, { status: 400 })

    const { error } = await supabaseAdmin.from('group_members')
      .upsert({ group_id: group.id, user_id: user.id, role: 'member', status: 'pending' },
              { onConflict: 'group_id,user_id' })
    if (error) return NextResponse.json({ error: "Could not join" }, { status: 500 })
    return NextResponse.json({ ok: true, groupId: group.id })
  }

  // Owner-only actions.
  if (body.action === 'approve' || body.action === 'decline') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id, max_members').eq('id', body.groupId).single()
    if (!group || group.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    if (body.action === 'approve') {
      const { count } = await supabaseAdmin.from('group_members')
        .select('id', { count: 'exact', head: true }).eq('group_id', body.groupId).eq('status', 'active')
      if ((count ?? 0) >= group.max_members) return NextResponse.json({ error: "Group full" }, { status: 400 })
      await supabaseAdmin.from('group_members').update({ status: 'active' })
        .eq('group_id', body.groupId).eq('user_id', body.userId)
    } else {
      await supabaseAdmin.from('group_members').delete()
        .eq('group_id', body.groupId).eq('user_id', body.userId).eq('status', 'pending')
    }
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'leave') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id').eq('id', body.groupId).single()
    if (group?.owner_id === user.id) return NextResponse.json({ error: "Owner can't leave" }, { status: 400 })
    await supabaseAdmin.from('group_members').delete().eq('group_id', body.groupId).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
```

- [ ] **Step 3: Test, verify, commit**

`tests/social/groups.spec.ts` drives create→join→approve across two contexts (or via `page.request`). Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/api/groups/ tests/social/groups.spec.ts
git commit -m "feat(social): groups + membership API with archive sweep"
```

---

### Task 7: Groups panel (create / join / list)

**Goal:** Replace the GroupsPanel stub with: list my groups, create-group form (name + term dates), join-by-code, and pending-approval management for owners; clicking a group opens its page.

**Files:**
- Modify: `app/components/community/GroupsPanel.tsx`

**Acceptance Criteria:**
- [ ] Lists active groups from `GET /api/groups`; each row opens the GroupPage (Task 8).
- [ ] Create form posts name + `term_start`/`term_end`; date inputs default start=today, end=today+4mo; client blocks ranges > 4 months.
- [ ] Join input posts the invite code and shows "request sent".

**Verify:** `tests/social/groups.spec.ts` extended through the UI: create a group, see it listed; second user joins by code and sees "request sent".

**Steps:**

- [ ] **Step 1: Implement** (renders a list + create/join forms; lifts a selected groupId up via an `onOpenGroup` prop so the parent CommunityView can swap to GroupPage).

```tsx
"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Group { id: number; name: string; invite_code: string; term_end: string; status: string }

function plusMonthsISO(months: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export const GroupsPanel = memo(function GroupsPanel({ theme, onOpenGroup }: { theme: "light" | "dark"; onOpenGroup: (id: number) => void }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState("")
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(plusMonthsISO(3))
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch('/api/groups')
    if (res.ok) setGroups((await res.json()).groups || [])
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    const res = await apiFetch('/api/groups', { method: 'POST', body: JSON.stringify({ name, term_start: start, term_end: end }) })
    const j = await res.json()
    if (res.ok) { setName(""); load() } else setMsg(j.error)
  }
  const join = async () => {
    const res = await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action: 'join', invite_code: code.trim() }) })
    const j = await res.json()
    setMsg(res.ok ? 'Request sent — waiting for approval' : j.error)
    setCode("")
  }

  const field = { padding: '9px 12px', borderRadius: 10, outline: 'none',
    border: `1px solid ${isDark ? '#3f3f46' : '#e0dacb'}`, background: isDark ? '#0e0c09' : '#fff', color: text } as const

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 560, margin: '0 auto' }}>
      <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Your groups</h3>
      {groups.length === 0 && <p style={{ color: '#8a857e', fontSize: 14 }}>No groups yet.</p>}
      {groups.map(g => (
        <button key={g.id} onClick={() => onOpenGroup(g.id)}
          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, marginBottom: 6, cursor: 'pointer',
            border: 'none', textAlign: 'left', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span>{g.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8a857e' }}>ends {g.term_end}</span>
        </button>
      ))}

      <h3 style={{ color: text, fontSize: 15, margin: '20px 0 8px' }}>Create a group</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="group name" style={field} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ ...field, flex: 1 }} />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ ...field, flex: 1 }} />
        </div>
        <button onClick={create} disabled={name.trim().length < 2}
          style={{ padding: '10px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer', opacity: name.trim().length < 2 ? 0.6 : 1 }}>Create</button>
      </div>

      <h3 style={{ color: text, fontSize: 15, margin: '20px 0 8px' }}>Join by code</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="invite code" style={{ ...field, flex: 1 }} />
        <button onClick={join} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>Join</button>
      </div>
      {msg && <p style={{ color: '#8a857e', fontSize: 13, marginTop: 10 }}>{msg}</p>}
    </div>
  )
})
```

- [ ] **Step 2: Thread `onOpenGroup` through `CommunityView`** — add `const [openGroupId, setOpenGroupId] = useState<number|null>(null)`; when set, render `<GroupPage groupId={openGroupId} onBack={() => setOpenGroupId(null)} .../>` instead of the tabs; pass `onOpenGroup={setOpenGroupId}` to `GroupsPanel`.

- [ ] **Step 3: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/components/community/GroupsPanel.tsx app/components/CommunityView.tsx tests/social/groups.spec.ts
git commit -m "feat(social): groups panel create/join/list"
```

---

### Task 8: Group page shell

**Goal:** A group page showing roster (active + pending with owner approve/decline), invite code, term countdown, and an archived banner when frozen.

**Files:**
- Create: `app/components/community/GroupPage.tsx`

**Acceptance Criteria:**
- [ ] Loads `GET /api/groups?id=` and renders active members + (for owner) pending requests with Approve/Decline.
- [ ] Shows the invite code (copyable) and days-until-`term_end`.
- [ ] When `group.status === 'archived'`, shows a read-only banner and hides join/approve controls.
- [ ] Non-owner sees a Leave button; owner does not.

**Verify:** `tests/social/groups.spec.ts` → after approval the new member appears in the roster; owner sees no Leave button.

**Steps:**

- [ ] **Step 1: Implement `GroupPage.tsx`**

```tsx
"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { apiFetch } from "@/lib/apiFetch"

const accent = '#d97706'
interface Member { user_id: string; role: string; status: string; focus_minutes_total: number; username?: string; level?: number }
interface Group { id: number; name: string; owner_id: string; invite_code: string; term_end: string; status: string }

export const GroupPage = memo(function GroupPage({
  theme, groupId, currentUserId, onBack,
}: { theme: "light" | "dark"; groupId: number; currentUserId: string; onBack: () => void }) {
  const isDark = theme === 'dark'
  const text = isDark ? '#fafafa' : '#0f0f10'
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/groups?id=${groupId}`)
    if (res.ok) { const j = await res.json(); setGroup(j.group); setMembers(j.members) }
  }, [groupId])
  useEffect(() => { load() }, [load])

  const isOwner = group?.owner_id === currentUserId
  const archived = group?.status === 'archived'
  const active = members.filter(m => m.status === 'active')
  const pending = members.filter(m => m.status === 'pending')
  const daysLeft = group ? Math.max(0, Math.ceil((new Date(group.term_end).getTime() - Date.now()) / 86400000)) : 0

  const decide = async (userId: string, action: 'approve' | 'decline') => {
    await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action, groupId, userId }) })
    load()
  }
  const leave = async () => {
    await apiFetch('/api/groups/membership', { method: 'POST', body: JSON.stringify({ action: 'leave', groupId }) })
    onBack()
  }

  if (!group) return <div style={{ padding: 24, color: text }}>Loading…</div>
  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ border: 'none', background: 'none', color: '#8a857e', cursor: 'pointer', marginBottom: 12 }}>← back</button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ color: text, margin: 0 }}>{group.name}</h2>
        <span style={{ color: '#8a857e', fontSize: 13 }}>{archived ? 'archived' : `${daysLeft}d left`}</span>
      </div>
      {archived && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(217,119,6,0.1)', color: accent }}>This term is over — read-only.</div>}

      {!archived && <div style={{ marginTop: 12, color: '#8a857e' }}>Invite:{' '}
        <button onClick={() => navigator.clipboard.writeText(group.invite_code)} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer' }}>{group.invite_code} ⧉</button>
      </div>}

      <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>Members ({active.length}/6)</h3>
      {active.map(m => (
        <div key={m.user_id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, marginBottom: 6,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
          <span>@{m.username ?? 'writer'}{m.role === 'owner' ? ' 👑' : ''}</span>
          <span style={{ marginLeft: 'auto', color: '#8a857e', fontSize: 12 }}>{m.focus_minutes_total} min</span>
        </div>
      ))}

      {isOwner && !archived && pending.length > 0 && <>
        <h3 style={{ color: text, fontSize: 15, margin: '18px 0 8px' }}>Requests</h3>
        {pending.map(m => (
          <div key={m.user_id} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, marginBottom: 6,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: text }}>
            <span>@{m.username ?? 'writer'}</span>
            <span style={{ marginLeft: 'auto' }}>
              <button onClick={() => decide(m.user_id, 'approve')} style={{ color: accent, border: 'none', background: 'none', cursor: 'pointer', marginRight: 8 }}>Approve</button>
              <button onClick={() => decide(m.user_id, 'decline')} style={{ color: '#8a857e', border: 'none', background: 'none', cursor: 'pointer' }}>Decline</button>
            </span>
          </div>
        ))}
      </>}

      {!isOwner && <button onClick={leave} style={{ marginTop: 18, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Leave group</button>}
    </div>
  )
})
```

> `currentUserId` is passed from `app/app/page.tsx` (`user.id`) down through `CommunityView`.

- [ ] **Step 2: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/components/community/GroupPage.tsx app/components/CommunityView.tsx app/app/page.tsx
git commit -m "feat(social): group page shell — roster, requests, term, archive banner"
```

---

### Task 9: Session reporting + VitalitySystem integration

**Goal:** When a focus session completes while a group room is active, report it: bump weekly minutes, all-time total, and insert a communal-grove tree.

**Files:**
- Create: `app/api/groups/report/route.ts`
- Modify: `app/components/VitalitySystem.tsx` (call report in `claimReward`)
- Modify: `app/app/page.tsx` (track `activeGroupId` from the open GroupPage, pass to VitalitySystem)

**Acceptance Criteria:**
- [ ] `POST /api/groups/report {groupId, minutes, tree}` verifies the caller is an active member of an active group, upserts `group_weekly(+minutes)`, increments `group_members.focus_minutes_total`, inserts `group_trees`. Rejects archived groups.
- [ ] `VitalitySystem.claimReward` calls the report endpoint when `activeGroupId` is set, with the session minutes and the planted tree snapshot.
- [ ] Reporting failure does not break the existing reward flow (best-effort, swallow errors).

**Verify:** `tests/social/report.spec.ts` → complete a session with a group active; `GET /api/groups?id=` shows the member's `focus_minutes_total` increased.

**Steps:**

- [ ] **Step 1: Create `app/api/groups/report/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-report:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const groupId = Number(body.groupId)
  const minutes = Math.max(0, Math.min(600, Math.floor(Number(body.minutes) || 0)))
  if (!groupId || minutes <= 0) return NextResponse.json({ error: "Bad input" }, { status: 400 })

  const { data: group } = await supabaseAdmin.from('study_groups').select('status').eq('id', groupId).single()
  if (!group || group.status !== 'active') return NextResponse.json({ error: "Inactive group" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('focus_minutes_total, status').eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const weekStart = getWeekStart()
  const { data: weekly } = await supabaseAdmin.from('group_weekly')
    .select('focus_minutes').eq('group_id', groupId).eq('user_id', user.id).eq('week_start', weekStart).maybeSingle()
  await supabaseAdmin.from('group_weekly').upsert({
    group_id: groupId, user_id: user.id, week_start: weekStart,
    focus_minutes: (weekly?.focus_minutes || 0) + minutes,
  }, { onConflict: 'group_id,user_id,week_start' })

  await supabaseAdmin.from('group_members')
    .update({ focus_minutes_total: (membership.focus_minutes_total || 0) + minutes })
    .eq('group_id', groupId).eq('user_id', user.id)

  if (body.tree) {
    await supabaseAdmin.from('group_trees').insert({ group_id: groupId, user_id: user.id, tree: body.tree })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Add `activeGroupId` prop to VitalitySystem and report in `claimReward`**

In `app/components/VitalitySystem.tsx`, add `activeGroupId?: number | null` to `VitalitySystemProps` and the destructure. In `claimReward`, after `logFocusSession(sessionMinutes, 0)`, add:

```tsx
if (activeGroupId) {
  const treeSnapshot = { type: treeType, stage: computeStage(Math.min(1, sessionMinutes / growthTarget)) }
  apiFetch('/api/groups/report', {
    method: 'POST',
    body: JSON.stringify({ groupId: activeGroupId, minutes: Math.round(sessionMinutes), tree: treeSnapshot }),
  }).catch(() => {}) // best-effort; never block the reward
}
```

> `computeStage` is already defined locally in `claimReward`; reuse it. `apiFetch` is already imported.

- [ ] **Step 3: Track `activeGroupId` in `app/app/page.tsx`**

Add `const [activeGroupId, setActiveGroupId] = useState<number | null>(null)`. When `CommunityView` opens a GroupPage, surface the id up (add an `onActiveGroupChange` callback prop to `CommunityView` that calls `setActiveGroupId(openGroupId)` on mount/unmount of GroupPage, and `null` on back/close). Pass `activeGroupId={activeGroupId}` into `<VitalitySystem .../>`.

- [ ] **Step 4: Test, verify, commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/api/groups/report/route.ts app/components/VitalitySystem.tsx app/app/page.tsx tests/social/report.spec.ts
git commit -m "feat(social): report group focus sessions"
```

---

### Task 10: Leaderboard + contributions on the group page

**Goal:** Show the weekly focus-minute leaderboard and all-time-this-term contributions, ranked, with each member's tree count.

**Files:**
- Create: `app/api/groups/leaderboard/route.ts`
- Modify: `app/components/community/GroupPage.tsx` (add a Leaderboard section)

**Acceptance Criteria:**
- [ ] `GET /api/groups/leaderboard?id=` returns `{ weekly: [{user_id, username, focus_minutes}], allTime: [{user_id, username, focus_minutes_total, trees}] }`, sorted desc, member-gated.
- [ ] GroupPage renders a "This week" ranked list and an "All term" ranked list with minutes + tree counts.
- [ ] Ties broken by username for stable ordering.

**Verify:** `tests/social/report.spec.ts` extended → after a reported session, the member tops the weekly list.

**Steps:**

- [ ] **Step 1: Create `app/api/groups/leaderboard/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-lb:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data: members } = await supabaseAdmin.from('group_members')
    .select('user_id, focus_minutes_total').eq('group_id', id).eq('status', 'active')
  const ids = (members ?? []).map(m => m.user_id)
  const safeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']

  const { data: profs } = await supabaseAdmin.from('player_profiles').select('user_id, username').in('user_id', safeIds)
  const uname: Record<string, string> = {}; for (const p of profs ?? []) uname[p.user_id] = p.username ?? 'writer'

  const { data: week } = await supabaseAdmin.from('group_weekly')
    .select('user_id, focus_minutes').eq('group_id', id).eq('week_start', getWeekStart())
  const weekMap: Record<string, number> = {}; for (const w of week ?? []) weekMap[w.user_id] = w.focus_minutes

  const { data: trees } = await supabaseAdmin.from('group_trees').select('user_id').eq('group_id', id)
  const treeCount: Record<string, number> = {}; for (const t of trees ?? []) treeCount[t.user_id] = (treeCount[t.user_id] || 0) + 1

  const byName = (a: any, b: any, key: string) => (b[key] - a[key]) || uname[a.user_id].localeCompare(uname[b.user_id])
  const weekly = (members ?? []).map(m => ({ user_id: m.user_id, username: uname[m.user_id], focus_minutes: weekMap[m.user_id] || 0 }))
    .sort((a, b) => byName(a, b, 'focus_minutes'))
  const allTime = (members ?? []).map(m => ({ user_id: m.user_id, username: uname[m.user_id], focus_minutes_total: m.focus_minutes_total, trees: treeCount[m.user_id] || 0 }))
    .sort((a, b) => byName(a, b, 'focus_minutes_total'))

  return NextResponse.json({ weekly, allTime })
}
```

- [ ] **Step 2: Add a leaderboard section to `GroupPage.tsx`** — fetch `/api/groups/leaderboard?id=` on load and render two ranked lists (`#1 @name — 120 min`, all-term shows `min · 🌳 N`). Reuse the existing row styling from the Members section.

- [ ] **Step 3: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/api/groups/leaderboard/route.ts app/components/community/GroupPage.tsx tests/social/report.spec.ts
git commit -m "feat(social): group leaderboard + contributions"
```

---

### Task 11: Communal grove rendering

**Goal:** Render the aggregate communal grove on the group page from `group_trees`, reusing the existing tree renderer.

**Files:**
- Create: `app/api/groups/grove/route.ts`
- Modify: `app/components/community/GroupPage.tsx` (add a grove section)

**Acceptance Criteria:**
- [ ] `GET /api/groups/grove?id=` returns `{ trees: Tree[] }` (member-gated), newest last, capped at 200.
- [ ] GroupPage renders the trees with `PlantIcon` in a simple ground strip (works for archived groups too).

**Verify:** `tests/social/report.spec.ts` extended → after a reported session with a tree, the grove section shows ≥ 1 tree.

**Steps:**

- [ ] **Step 1: Create `app/api/groups/grove/route.ts`**

```ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-grove:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data } = await supabaseAdmin.from('group_trees')
    .select('tree').eq('group_id', id).order('planted_at', { ascending: true }).limit(200)
  return NextResponse.json({ trees: (data ?? []).map(r => r.tree) })
}
```

- [ ] **Step 2: Render in `GroupPage.tsx`** — fetch `/api/groups/grove?id=`, lay trees along a horizontal ground strip:

```tsx
import { PlantIcon } from "@/app/components/PlantIcon"
// …inside the component, after leaderboard:
// const [grove, setGrove] = useState<any[]>([]) ; fetch in load()
<div style={{ marginTop: 20 }}>
  <h3 style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>Communal grove</h3>
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 4,
    padding: 16, borderRadius: 14, background: isDark ? 'rgba(120,140,80,0.10)' : 'rgba(120,140,80,0.14)' }}>
    {grove.length === 0 && <span style={{ color: '#8a857e', fontSize: 13 }}>No trees yet — start a session here.</span>}
    {grove.map((t, i) => <PlantIcon key={i} type={t.type || 'tangerine'} size={48} stage={t.stage ?? 3} hideGround />)}
  </div>
</div>
```

- [ ] **Step 3: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add app/api/groups/grove/route.ts app/components/community/GroupPage.tsx tests/social/report.spec.ts
git commit -m "feat(social): communal grove rendering"
```

---

### Task 12: Live presence (Supabase Realtime)

**Goal:** Members in a group page join a Realtime presence channel; show who's online / focusing with live timers, and refresh the grove when a tree is broadcast.

**Files:**
- Create: `app/components/community/useGroupPresence.ts`
- Modify: `app/components/community/GroupPage.tsx` (presence dots + live timers)
- Modify: `app/components/VitalitySystem.tsx` (broadcast focusing state + tree on completion when in a group)

**Acceptance Criteria:**
- [ ] Opening a group page joins channel `group:{id}`, tracking `{ user_id, username, status, timer_end }`.
- [ ] Roster shows an online indicator; members in a session show a ticking remaining time derived from `timer_end`.
- [ ] On session completion the client broadcasts a `tree` event; other clients re-fetch the grove (or append).
- [ ] Leaving the page untracks/unsubscribes (no leaked channels).

**Verify:** Manual two-browser check (documented) + `tests/social/presence.spec.ts` asserting a focusing member shows an online indicator in a second context. (Realtime e2e is timing-sensitive; keep the assertion coarse.)

**Steps:**

- [ ] **Step 1: Create `useGroupPresence.ts`**

```ts
"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface Presence { user_id: string; username: string; status: 'online' | 'focusing'; timer_end?: number }

export function useGroupPresence(groupId: number | null, me: { user_id: string; username: string }) {
  const [peers, setPeers] = useState<Record<string, Presence>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!groupId) return
    const channel = supabase.channel(`group:${groupId}`, { config: { presence: { key: me.user_id } } })
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Presence[]>
      const flat: Record<string, Presence> = {}
      for (const key of Object.keys(state)) flat[key] = state[key][0]
      setPeers(flat)
    })
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: me.user_id, username: me.username, status: 'online' } as Presence)
      }
    })
    return () => { channel.untrack(); supabase.removeChannel(channel); channelRef.current = null }
  }, [groupId, me.user_id, me.username])

  const setStatus = (status: 'online' | 'focusing', timer_end?: number) => {
    channelRef.current?.track({ user_id: me.user_id, username: me.username, status, timer_end } as Presence)
  }
  const broadcastTree = () => { channelRef.current?.send({ type: 'broadcast', event: 'tree', payload: {} }) }

  return { peers, setStatus, broadcastTree, channel: channelRef }
}
```

- [ ] **Step 2: Use it in `GroupPage.tsx`** — call `useGroupPresence(groupId, { user_id: currentUserId, username: myUsername })`; merge `peers[m.user_id]?.status` into the roster (green dot when online, "focusing — mm:ss" computed from `timer_end - now` on a 1s interval). Subscribe to the `tree` broadcast event on the channel to re-fetch the grove.

- [ ] **Step 3: Broadcast from VitalitySystem** — when `activeGroupId` is set, on session start set presence `focusing` with `timer_end = Date.now() + total*1000`, and on completion send the `tree` broadcast. The simplest wiring: pass `activeGroupId` down (already done in Task 9) and have GroupPage own a shared channel; VitalitySystem signals via a lightweight callback prop `onGroupSessionEvent?(kind: 'start'|'complete', timerEnd?)` routed through `app/app/page.tsx` to GroupPage. Keep the channel ownership in GroupPage; VitalitySystem only emits events.

- [ ] **Step 4: Verify & commit**

Run: `npx tsc --noEmit && npm run lint`. Document the manual two-browser check in the PR description.

```bash
git add app/components/community/useGroupPresence.ts app/components/community/GroupPage.tsx app/components/VitalitySystem.tsx app/app/page.tsx tests/social/presence.spec.ts
git commit -m "feat(social): live group presence + tree broadcast"
```

---

## Self-Review

**Spec coverage:**
- Friends (username, friend code, request/accept) → Tasks 1, 2, 4, 5. ✓
- Username claim flow → Task 2. ✓
- Groups create/join/owner-approve, cap 6 → Tasks 6, 7, 8. ✓
- Term dates owner-set ≤ 4 months + archive → Tasks 0 (CHECK), 1 (`validateTerm`), 6 (sweep), 8 (banner). ✓
- Live presence rooms → Task 12. ✓
- Communal grove (group-tagged trees) → Tasks 9 (write), 11 (render). ✓
- Weekly + all-time focus-minute competition + contributions → Tasks 9, 10. ✓
- Community tab UI (sibling of Stats/Shop, fade) → Task 3. ✓
- RLS / server-authoritative writes → Task 0 + every route uses `supabaseAdmin` after `getAuthUser`. ✓
- School at signup → Task 2 (modal includes school). ✓

**Non-goals respected:** no shared mutable grove, no public discovery, no chat, no auto term dates, no blocking. ✓

**Type consistency:** `validateTerm`/`generateInviteCode`/`generateFriendCode` defined in Task 1 and used in Tasks 2/6. `computeStage` reused (not redefined) in Task 9. `activeGroupId` introduced in Task 9 and consumed in Task 12. `getWeekStart` imported from `lib/leagues.ts` in Tasks 9/10. Member shape (`focus_minutes_total`, `status`, `username`) consistent across Tasks 6/8/10.

**Placeholder scan:** No "TBD/TODO/handle edge cases" — UI-heavy steps (Task 10 §2, Task 11 §2, Task 12 §2–3) describe concrete wiring against code blocks already shown; backend and core logic carry full code.

## Notes for the implementer

- Two-user Playwright flows (Tasks 4, 6, 9) need a second authenticated context. Reuse whatever auth fixture the existing `tests/` specs use; if none exists, add a minimal sign-in helper before these tasks.
- Migrations apply through Supabase (SQL editor or `supabase db push`) — there is no local migration runner wired into `npm` scripts.
- After the whole feature lands, follow the project's frontend workflow (pull, then ask before merging; the frontend worktree is the integration path).
