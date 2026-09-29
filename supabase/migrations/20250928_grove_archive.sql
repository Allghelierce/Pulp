-- Archived groves by past grade. Changing school year snapshots the old orchard
-- here (keyed by grade, e.g. {"7th Grade": [...trees]}) instead of losing it.
-- Returning to a grade that has an archive restores that orchard.
alter table player_profiles add column if not exists grove_archive jsonb not null default '{}'::jsonb;
