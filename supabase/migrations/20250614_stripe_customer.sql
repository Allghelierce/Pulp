-- Link a player to their Stripe customer so webhooks can grant/revoke Pro.
alter table player_profiles add column if not exists stripe_customer_id text;
create index if not exists idx_profiles_stripe_customer on player_profiles (stripe_customer_id);
