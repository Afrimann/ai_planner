create extension if not exists "pgcrypto";

do $$
begin
  create type public.post_platform as enum ('instagram', 'linkedin', 'twitter');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_status as enum ('draft', 'planned', 'posted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.workspace_member_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.workspace_member_status as enum ('pending', 'active');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  caption text not null default '',
  user_id uuid not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  platform public.post_platform not null default 'instagram',
  status public.post_status not null default 'draft',
  scheduled_date date,
  scheduled_time time,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();


create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  action text not null,
  input_text text not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_logs
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid,
  email text not null,
  role public.workspace_member_role not null default 'member',
  status public.workspace_member_status not null default 'pending',
  invited_by uuid not null,
  invited_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  type text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists workspace_members_workspace_email_key
  on public.workspace_members (workspace_id, email);

create unique index if not exists workspace_members_workspace_user_key
  on public.workspace_members (workspace_id, user_id)
  where user_id is not null;

create index if not exists workspace_members_user_status_idx
  on public.workspace_members (user_id, status, invited_at desc);

create index if not exists workspace_members_workspace_status_idx
  on public.workspace_members (workspace_id, status, invited_at desc);

create index if not exists posts_user_workspace_created_at_idx
  on public.posts (user_id, workspace_id, created_at desc);

create index if not exists posts_workspace_created_at_idx
  on public.posts (workspace_id, created_at desc);

create index if not exists ai_logs_workspace_created_at_idx
  on public.ai_logs (workspace_id, created_at desc);

create index if not exists reports_workspace_created_at_idx
  on public.reports (workspace_id, created_at desc);

create index if not exists activities_actor_created_at_idx
  on public.activities (actor_id, created_at desc);

create index if not exists activities_workspace_created_at_idx
  on public.activities (workspace_id, created_at desc);

-- Manual Supabase dashboard setup still required:
-- 1) create storage bucket `post-images`
-- 2) add storage RLS policies for authenticated users (per-user object paths)
-- 3) add table RLS policies for `posts`, `ai_logs`, `workspaces`,
--    `workspace_members`, `reports`, and `activities`
-- 4) if your schema uses `scheduled_at` instead of scheduled_date/scheduled_time,
--    update this SQL and regenerate TypeScript types.
