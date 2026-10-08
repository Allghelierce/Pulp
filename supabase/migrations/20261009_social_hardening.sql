-- Social hardening (friends + parties). Safe to re-run.
-- The app already works without it: /api/groups/report falls back to a
-- compare-and-swap path while party_report_focus is missing.

-- ── Friendships: what a signed-in client may do on its own ──────────
-- The app writes friendships through the service role (/api/friends); these
-- bound what someone could do with the anon key and their own session.

-- Asking: only as yourself, and only a pending request.
drop policy if exists friendships_insert on friendships;
create policy friendships_insert on friendships for insert
  with check (auth.uid() = requester_id and status = 'pending');

-- Accepting: only the addressee, and only to 'accepted' ...
drop policy if exists friendships_update on friendships;
create policy friendships_update on friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status = 'accepted');

-- ... and status is the only column a client can change or set (no pointing a
-- row at someone else, no back-dated created_at).
revoke insert, update on friendships from anon, authenticated;
grant insert (requester_id, addressee_id, status) on friendships to authenticated;
grant update (status) on friendships to authenticated;

-- Unfriending / withdrawing / declining: either party.
drop policy if exists friendships_delete on friendships;
create policy friendships_delete on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ── Parties: every write goes through the service role ──────────────
-- (/api/groups*), so clients get no write policy at all. The old owner update
-- policy let an owner rewrite their own party directly (status, season dates,
-- max_members) around the server's rules.
drop policy if exists groups_update on study_groups;

-- ── Focus reports: one locked step ──────────────────────────────────
-- Credits minutes to an active member, holding a per-player lock so parallel
-- reports add up instead of overwriting each other. p_cap is the most the
-- player may have this week across all parties (the app's daily cap times the
-- days so far). Returns the minutes credited (0 when capped), or null when
-- they aren't an active member.
create or replace function party_report_focus(p_group bigint, p_user uuid, p_week date, p_minutes int, p_cap int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_used int; v_credit int;
begin
  perform pg_advisory_xact_lock(hashtextextended('party_report_focus:' || p_user::text, 0));
  perform 1 from group_members where group_id = p_group and user_id = p_user and status = 'active';
  if not found then return null; end if;

  select coalesce(sum(focus_minutes), 0) into v_used
    from group_weekly where user_id = p_user and week_start = p_week;
  v_credit := greatest(0, least(p_minutes, p_cap - v_used));
  if v_credit = 0 then return 0; end if;

  insert into group_weekly (group_id, user_id, week_start, focus_minutes)
  values (p_group, p_user, p_week, v_credit)
  on conflict (group_id, user_id, week_start) do update
    set focus_minutes = group_weekly.focus_minutes + excluded.focus_minutes;
  update group_members set focus_minutes_total = focus_minutes_total + v_credit
    where group_id = p_group and user_id = p_user;
  return v_credit;
end $$;

revoke execute on function party_report_focus(bigint, uuid, date, int, int) from public, anon, authenticated;
grant execute on function party_report_focus(bigint, uuid, date, int, int) to service_role;

notify pgrst, 'reload schema';
