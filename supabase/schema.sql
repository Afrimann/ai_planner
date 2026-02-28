create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
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
