-- My Kitchen database schema. Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Every row belongs to the signed-in user (user_id defaults to auth.uid()), and
-- Row Level Security makes sure each user can only see and change their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  name text not null default '',
  onboarded boolean not null default false,
  diets text[] not null default '{}',
  avoid text[] not null default '{}',
  cuisines text[] not null default '{}',
  kitchen text[] not null default '{}',
  inspiration text[] not null default '{}',
  skill text[] not null default '{}',
  notes text not null default '',
  eat_minutes int not null default 15,
  store text not null default ''
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text not null,
  description text not null default '',
  prep int not null default 0,
  cook int not null default 0,
  clean int not null default 0,
  servings int not null default 2,
  image text,
  ingredients jsonb not null default '[]',
  steps text[] not null default '{}',
  tags text[] not null default '{}',
  source text not null default 'manual',
  source_url text,
  favorite boolean not null default false,
  rating int,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  storage text not null default 'Fridge',
  expires_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  aisle text not null default 'Other',
  checked boolean not null default false,
  recipe_id uuid references public.recipes on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  day date not null,
  recipe_id uuid not null references public.recipes on delete cascade,
  servings int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.pantry_items enable row level security;
alter table public.shopping_items enable row level security;
alter table public.plan_entries enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own recipes" on public.recipes;
create policy "own recipes" on public.recipes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own pantry" on public.pantry_items;
create policy "own pantry" on public.pantry_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own shopping" on public.shopping_items;
create policy "own shopping" on public.shopping_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own plan" on public.plan_entries;
create policy "own plan" on public.plan_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Data API access. Only signed-in users get table access (RLS above limits them to their own rows).
-- Needed when "Automatically expose new tables" is turned off in Supabase; harmless otherwise.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.recipes, public.pantry_items, public.shopping_items, public.plan_entries to authenticated;
revoke all on public.profiles, public.recipes, public.pantry_items, public.shopping_items, public.plan_entries from anon;
