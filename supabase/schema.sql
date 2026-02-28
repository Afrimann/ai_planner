create extension if not exists "pgcrypto";

create type if not exists public.post_platform as enum ('instagram', 'linkedin', 'twitter');
create type if not exists public.post_status as enum ('draft', 'planned', 'posted');

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform public.post_platform not null,
  title text,
  caption text not null,
  image_url text,
  status public.post_status not null default 'draft',
  scheduled_date date,
  scheduled_time time,
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
