-- Run this in the Supabase SQL editor to set up the database schema.

-- Profiles: extends Supabase Auth users
create table public.profiles (
  id uuid references auth.users primary key,
  tier text not null default 'free',
  tier_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Row-level security: users can only read their own profile
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Tier slot counters
create table public.config (
  key text primary key,
  value text not null
);

insert into public.config values ('founding_slots_used', '0');
insert into public.config values ('founding_slots_total', '100');
insert into public.config values ('earlybird_slots_used', '0');
insert into public.config values ('earlybird_slots_total', '900');

-- Operation metadata only — no file content or filenames ever
-- ip_address is stored for anonymous rate limiting; it is never logged alongside filenames
create table public.usage_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id),
  ip_address text,
  operation text not null,
  file_size_bytes integer,
  duration_ms integer,
  created_at timestamptz default now()
);

-- Phase 2: e-signature audit trail
create table public.signature_events (
  id uuid primary key default gen_random_uuid(),
  document_hash text not null,
  signer_email text not null,
  ip_address text not null,
  user_agent text,
  signed_at timestamptz default now(),
  status text default 'pending'
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
