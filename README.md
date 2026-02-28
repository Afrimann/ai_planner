# AI Planner (Next.js 14)

Production-ready App Router project using TypeScript and Tailwind CSS.

## Stack

- Next.js 14 App Router
- Server Components by default
- Server Actions for write operations
- Tailwind CSS
- Supabase REST API for persistence

## Project structure

- `app/dashboard` dashboard route
- `app/calendar` calendar route
- `app/posts` posts route
- `app/posts/[id]` post detail route
- `app/api/ai` AI API route
- `components` reusable UI components
- `lib` domain logic + validation
- `supabase` typed schema + SQL
- `ai` AI provider integration
- `types` shared TypeScript contracts

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=post-images
OPENAI_API_KEY=
```

## Database setup

Run the SQL in `supabase/schema.sql` in your Supabase project.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```
