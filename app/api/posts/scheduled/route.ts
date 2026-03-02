import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { selectPostsByUserId } from "@/supabase/client";
import type { PostStatus } from "@/types";

interface ScheduledPostApiItem {
  id: string;
  title?: string;
  body: string;
  caption?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  user_id: string;
  status: PostStatus;
}

function normalizeScheduledTime(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/);
  if (!match) {
    return undefined;
  }

  return `${match[1]}:${match[2]}`;
}

export async function GET(request: Request) {
  let userId = "";

  try {
    const user = await requireAuthenticatedUser(request);
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const rows = await selectPostsByUserId(userId);

    // Return only posts that are expected to trigger reminders.
    const posts: ScheduledPostApiItem[] = rows
      .filter((row) => row.status === "planned" && Boolean(row.scheduled_date))
      .map((row) => ({
        id: row.id,
        title: row.title ?? undefined,
        body: row.body,
        caption: row.caption ?? row.body,
        scheduled_date: row.scheduled_date ?? undefined,
        scheduled_time: normalizeScheduledTime(row.scheduled_time),
        user_id: row.user_id,
        status: row.status,
      }))
      .sort((a, b) => {
        const aKey = `${a.scheduled_date ?? ""}-${a.scheduled_time ?? "00:00"}`;
        const bKey = `${b.scheduled_date ?? ""}-${b.scheduled_time ?? "00:00"}`;
        return aKey.localeCompare(bKey);
      });

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch scheduled posts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
