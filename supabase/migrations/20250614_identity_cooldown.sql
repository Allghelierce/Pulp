-- Per-field change timestamps for username/school/grade — enforces a one-week edit cooldown.
alter table player_profiles add column if not exists identity_changed_at jsonb not null default '{}'::jsonb;
