let warnedPostSetup = false;

export function warnPostManagementSupabaseSetup(): void {
  if (warnedPostSetup) {
    return;
  }

  warnedPostSetup = true;

  // Manual checks are required in Supabase dashboard for production safety.
  console.warn(
    "[AI Planner Setup] Verify Supabase manual setup: bucket `post-images`, storage RLS for per-user uploads/reads, posts table columns, and env vars NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
}
