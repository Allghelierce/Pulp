-- Student grade, chosen at onboarding. Used to title the grove (e.g. "7th Grade · Fall Semester").
alter table player_profiles add column if not exists grade text;
