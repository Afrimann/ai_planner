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

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  caption text not null default '',
  user_id uuid not null,
  platform public.post_platform not null default 'instagram',
  status public.post_status not null default 'draft',
  scheduled_date date,
  scheduled_time time,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  action text not null,
  input_text text not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

-- Manual Supabase dashboard setup still required:
-- 1) create storage bucket `post-images`
-- 2) add storage RLS policies for authenticated users (per-user object paths)
-- 3) add table RLS policies for `posts` and `ai_logs`
-- 4) if your schema uses `scheduled_at` instead of scheduled_date/scheduled_time,
--    update this SQL and regenerate TypeScript types.
