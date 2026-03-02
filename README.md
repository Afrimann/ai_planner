# AI Planner (Next.js 14)

Production-ready App Router project using TypeScript and Tailwind CSS.

## Stack

- Next.js 14 App Router
- Server Components by default
- Server Actions for write operations
- Tailwind CSS (custom professional white/black theme)
- Framer Motion for subtle page and sidebar animations
- Supabase REST API for persistence

The app now uses a global layout with a responsive sidebar and header; see `components/layout` for the reusable pieces.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=post-images
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

## Database setup

Run the SQL in `supabase/schema.sql` in your Supabase project.

## Supabase manual checks (required)

- Ensure storage bucket `post-images` exists.
- Add storage RLS policies so authenticated users can upload and read only their own files.
- Ensure `public.posts` exists and is exposed to PostgREST.
- This project stores scheduling as `scheduled_date` + `scheduled_time`. If your schema uses `scheduled_at`, update `supabase/schema.sql` and regenerate `supabase/database.types.ts`.
- Server-side uploads and DB writes use `SUPABASE_SERVICE_ROLE_KEY`; browser auth/session uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

