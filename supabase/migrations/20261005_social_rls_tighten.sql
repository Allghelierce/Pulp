-- Tighten social RLS. All social writes go through server routes (service role,
-- which bypasses RLS), so direct client access only needs narrow reads.

-- Friendships: a requester may only create a *pending* request, and only the
-- addressee may change a row (accepting is the recipient's call).
drop policy if exists friendships_insert on friendships;
create policy friendships_insert on friendships for insert
  with check (auth.uid() = requester_id and status = 'pending');

drop policy if exists friendships_update on friendships;
create policy friendships_update on friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status in ('pending', 'accepted'));

-- Groups: only approved members read the group; pending joiners see nothing
-- beyond their own membership row.
drop policy if exists groups_select on study_groups;
create policy groups_select on study_groups for select
  using (public.is_active_group_member(study_groups.id));

drop policy if exists group_members_select on group_members;
create policy group_members_select on group_members for select
  using (user_id = auth.uid() or public.is_active_group_member(group_members.group_id));

-- Owners edit groups through the API (which enforces max_members etc.), not directly.
drop policy if exists groups_update on study_groups;
