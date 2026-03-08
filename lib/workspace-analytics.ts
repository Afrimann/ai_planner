import {
  selectAILogsByWorkspaceId,
  selectPostsByUserId,
  selectPostsByWorkspaceId,
} from "@/supabase/client";
import type { Database } from "@/supabase/database.types";
import {
  listWorkspaceMembersForUser,
  requireWorkspaceForUser,
  type WorkspaceMemberRole,
} from "@/lib/workspaces";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type AILogRow = Database["public"]["Tables"]["ai_logs"]["Row"];

interface ActiveWorkspaceMember {
  user_id: string;
  email: string;
  role: WorkspaceMemberRole;
}

export interface WorkspaceAnalyticsMember {
  user_id: string;
  email: string;
  role: WorkspaceMemberRole;
  total_posts: number;
  posted_posts: number;
  planned_posts: number;
  draft_posts: number;
  ai_usage_count: number;
}

export interface WorkspaceAnalyticsTimelinePoint {
  key: string;
  label: string;
  total_posts: number;
  posted_posts: number;
  planned_posts: number;
  draft_posts: number;
  ai_usage_count: number;
}

export interface WorkspaceAnalyticsSnapshot {
  workspace_id: string;
  workspace_name: string;
  user_total_posts: number;
  workspace_total_posts: number;
  workspace_total_ai_usage: number;
  active_member_count: number;
  posts: PostRow[];
  ai_logs: AILogRow[];
  members: WorkspaceAnalyticsMember[];
  timeline: WorkspaceAnalyticsTimelinePoint[];
}

function monthKey(date: Date): string {
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

function toMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getLastMonthBuckets(months: number): WorkspaceAnalyticsTimelinePoint[] {
  const now = new Date();
  const points: WorkspaceAnalyticsTimelinePoint[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1),
    );

    points.push({
      key: monthKey(monthDate),
      label: toMonthLabel(monthDate),
      total_posts: 0,
      posted_posts: 0,
      planned_posts: 0,
      draft_posts: 0,
      ai_usage_count: 0,
    });
  }

  return points;
}

function collectActiveWorkspaceMembers(
  members: Awaited<ReturnType<typeof listWorkspaceMembersForUser>>,
  ownerId: string,
): ActiveWorkspaceMember[] {
  const byUserId = new Map<string, ActiveWorkspaceMember>();

  for (const member of members) {
    if (member.status !== "active" || !member.user_id) {
      continue;
    }

    const existing = byUserId.get(member.user_id);
    if (!existing) {
      byUserId.set(member.user_id, {
        user_id: member.user_id,
        email: member.email,
        role: member.role,
      });
      continue;
    }

    byUserId.set(member.user_id, {
      user_id: member.user_id,
      email: existing.email || member.email,
      role:
        existing.role === "owner" || member.role !== "owner"
          ? existing.role
          : member.role,
    });
  }

  if (!byUserId.has(ownerId)) {
    byUserId.set(ownerId, {
      user_id: ownerId,
      email: "",
      role: "owner",
    });
  }

  return Array.from(byUserId.values());
}

export async function getWorkspaceAnalyticsForUser(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAnalyticsSnapshot> {
  const workspace = await requireWorkspaceForUser(userId, workspaceId);
  const workspaceMembers = await listWorkspaceMembersForUser(userId, workspaceId);
  const activeMembers = collectActiveWorkspaceMembers(
    workspaceMembers,
    workspace.owner_id,
  );

  const [posts, aiLogs, userPosts] = await Promise.all([
    selectPostsByWorkspaceId(workspace.id),
    selectAILogsByWorkspaceId(workspace.id),
    selectPostsByUserId(userId),
  ]);

  const statsByUserId = new Map<
    string,
    {
      total_posts: number;
      posted_posts: number;
      planned_posts: number;
      draft_posts: number;
      ai_usage_count: number;
    }
  >();

  for (const member of activeMembers) {
    statsByUserId.set(member.user_id, {
      total_posts: 0,
      posted_posts: 0,
      planned_posts: 0,
      draft_posts: 0,
      ai_usage_count: 0,
    });
  }

  for (const post of posts) {
    const stats = statsByUserId.get(post.user_id) ?? {
      total_posts: 0,
      posted_posts: 0,
      planned_posts: 0,
      draft_posts: 0,
      ai_usage_count: 0,
    };
    statsByUserId.set(post.user_id, stats);

    stats.total_posts += 1;
    if (post.status === "posted") {
      stats.posted_posts += 1;
    } else if (post.status === "planned") {
      stats.planned_posts += 1;
    } else {
      stats.draft_posts += 1;
    }
  }

  for (const log of aiLogs) {
    const stats = statsByUserId.get(log.user_id) ?? {
      total_posts: 0,
      posted_posts: 0,
      planned_posts: 0,
      draft_posts: 0,
      ai_usage_count: 0,
    };
    statsByUserId.set(log.user_id, stats);

    stats.ai_usage_count += 1;
  }

  const activeMemberByUserId = new Map(
    activeMembers.map((member) => [member.user_id, member]),
  );
  const members = Array.from(statsByUserId.entries())
    .map(([memberUserId, stats]) => {
      const activeMember = activeMemberByUserId.get(memberUserId);
      return {
        user_id: memberUserId,
        email: activeMember?.email ?? "",
        role: activeMember?.role ?? ("member" as WorkspaceMemberRole),
        total_posts: stats.total_posts,
        posted_posts: stats.posted_posts,
        planned_posts: stats.planned_posts,
        draft_posts: stats.draft_posts,
        ai_usage_count: stats.ai_usage_count,
      };
    })
    .sort((a, b) => {
      if (b.total_posts !== a.total_posts) {
        return b.total_posts - a.total_posts;
      }

      return a.user_id.localeCompare(b.user_id);
    });

  const timeline = getLastMonthBuckets(6);
  const timelineByKey = new Map(timeline.map((point) => [point.key, point]));

  for (const post of posts) {
    const createdAt = new Date(post.created_at);
    if (!Number.isFinite(createdAt.getTime())) {
      continue;
    }

    const bucket = timelineByKey.get(monthKey(createdAt));
    if (!bucket) {
      continue;
    }

    bucket.total_posts += 1;
    if (post.status === "posted") {
      bucket.posted_posts += 1;
    } else if (post.status === "planned") {
      bucket.planned_posts += 1;
    } else {
      bucket.draft_posts += 1;
    }
  }

  for (const log of aiLogs) {
    const createdAt = new Date(log.created_at);
    if (!Number.isFinite(createdAt.getTime())) {
      continue;
    }

    const bucket = timelineByKey.get(monthKey(createdAt));
    if (!bucket) {
      continue;
    }

    bucket.ai_usage_count += 1;
  }

  return {
    workspace_id: workspace.id,
    workspace_name: workspace.name,
    user_total_posts: userPosts.length,
    workspace_total_posts: posts.length,
    workspace_total_ai_usage: aiLogs.length,
    active_member_count: activeMembers.length,
    posts,
    ai_logs: aiLogs,
    members,
    timeline,
  };
}
