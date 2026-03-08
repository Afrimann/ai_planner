import { redirect } from "next/navigation";

import type { Activity } from "@/lib/activities";
import { getRecentWorkspaceActivityForUser, getUserActivities } from "@/lib/activities";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { listPostsForAuthenticatedUser } from "@/lib/posts";
import type { WorkspaceReport } from "@/lib/reports";
import { getWorkspaceReportsForUser } from "@/lib/reports";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";
import { getWorkspaceAnalyticsForUser } from "@/lib/workspace-analytics";
import type {
  WorkspaceAccess,
  WorkspaceMember,
  WorkspaceMemberRole,
} from "@/lib/workspaces";
import {
  listUserWorkspaceAccess,
  listWorkspaceMembersForUser,
} from "@/lib/workspaces";
import { selectAILogsByUserId } from "@/supabase/client";
import type { Database } from "@/supabase/database.types";
import type { Post, PostPlatform, PostStatus } from "@/types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export interface DashboardUser {
  id: string;
  email?: string;
  plan?: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  helper: string;
}

export interface DashboardSeriesPoint {
  label: string;
  planned: number;
  posted: number;
  aiCalls: number;
}

export interface DashboardPlatformPoint {
  platform: PostPlatform;
  label: string;
  count: number;
}

export interface DashboardAIRecord {
  id: string;
  action: string;
  input_text: string;
  output_text: string;
  created_at: string;
}

export interface DashboardAlert {
  id: string;
  kind: "info" | "success" | "warning";
  title: string;
  message: string;
}

export interface DashboardWorkspace {
  id: string;
  name: string;
  owner_id: string;
  role: WorkspaceMemberRole;
  created_at: string;
}

export interface DashboardWorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  role: WorkspaceMemberRole;
  status: "pending" | "active";
  invited_by: string;
  invited_at: string;
}

export interface DashboardRecentActivity {
  id: string;
  actor_id: string;
  workspace_id: string | null;
  scope: "user" | "workspace";
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardData {
  user: DashboardUser;
  posts: Post[];
  upcomingPosts: Post[];
  metrics: DashboardMetric[];
  weeklySeries: DashboardSeriesPoint[];
  platformBreakdown: DashboardPlatformPoint[];
  aiLogs: DashboardAIRecord[];
  alerts: DashboardAlert[];
  workspace: DashboardWorkspace | null;
  workspaces: DashboardWorkspace[];
  reports: WorkspaceReport[];
  recentActivity: DashboardRecentActivity[];
  workspaceMembers: DashboardWorkspaceMember[];
  userTotalPosts: number;
  workspaceTotalPosts: number | null;
  canInviteWorkspaceMembers: boolean;
  canGenerateWorkspaceReports: boolean;
}

function asDateOnly(value: string): string {
  return value.slice(0, 10);
}

function normalizePlatformLabel(platform: PostPlatform): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function clampInt(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function getStatusCounts(posts: Post[]): Record<PostStatus, number> {
  return posts.reduce<Record<PostStatus, number>>(
    (acc, post) => {
      acc[post.status] += 1;
      return acc;
    },
    { draft: 0, planned: 0, posted: 0 },
  );
}

function generateWeeklyLabels(weeks: number): string[] {
  const today = new Date();
  const labels: string[] = [];

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index * 7);
    labels.push(
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    );
  }

  return labels;
}

function groupPostsIntoWeeklySeries(
  posts: Post[],
  aiLogs: DashboardAIRecord[],
): DashboardSeriesPoint[] {
  const labels = generateWeeklyLabels(6);
  const today = new Date();
  const points = labels.map((label) => ({
    label,
    planned: 0,
    posted: 0,
    aiCalls: 0,
  }));

  posts.forEach((post) => {
    const pivotDate = post.scheduled_date ?? asDateOnly(post.updated_at);
    const date = new Date(`${pivotDate}T00:00:00`);
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    const bucket = 5 - Math.floor(diffDays / 7);

    if (bucket < 0 || bucket > 5) {
      return;
    }

    if (post.status === "planned") {
      points[bucket].planned += 1;
    }
    if (post.status === "posted") {
      points[bucket].posted += 1;
    }
  });

  aiLogs.forEach((log) => {
    const date = new Date(log.created_at);
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    const bucket = 5 - Math.floor(diffDays / 7);

    if (bucket < 0 || bucket > 5) {
      return;
    }

    points[bucket].aiCalls += 1;
  });

  return points;
}

function buildAlerts(
  statusCounts: Record<PostStatus, number>,
  upcomingCount: number,
  aiLogCount: number,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (statusCounts.draft > 0) {
    alerts.push({
      id: "draft-reminder",
      kind: "warning",
      title: "Drafts pending review",
      message: `${statusCounts.draft} draft post(s) still need scheduling or publishing.`,
    });
  }

  if (upcomingCount === 0) {
    alerts.push({
      id: "pipeline-empty",
      kind: "info",
      title: "No upcoming posts",
      message:
        "Schedule at least one post in the next 7 days to keep your pipeline active.",
    });
  }

  if (aiLogCount > 0) {
    alerts.push({
      id: "ai-activity",
      kind: "success",
      title: "AI assistant active",
      message: `You generated ${aiLogCount} AI result(s) recently.`,
    });
  }

  return alerts;
}

function pickActiveWorkspaceAccess(
  workspaces: WorkspaceAccess[],
  requestedWorkspaceId?: string | null,
): WorkspaceAccess | null {
  if (workspaces.length === 0 || !requestedWorkspaceId?.trim()) {
    return null;
  }

  const normalizedRequested = requestedWorkspaceId?.trim();
  if (!normalizedRequested) {
    return null;
  }

  const requested = workspaces.find(
    (entry) => entry.workspace.id === normalizedRequested,
  );
  return requested ?? null;
}

function mapWorkspaceAccess(access: WorkspaceAccess): DashboardWorkspace {
  return {
    id: access.workspace.id,
    name: access.workspace.name,
    owner_id: access.workspace.owner_id,
    role: access.role,
    created_at: access.workspace.created_at,
  };
}

function mapWorkspaceMember(member: WorkspaceMember): DashboardWorkspaceMember {
  return {
    id: member.id,
    workspace_id: member.workspace_id,
    user_id: member.user_id,
    email: member.email,
    role: member.role,
    status: member.status,
    invited_by: member.invited_by,
    invited_at: member.invited_at,
  };
}

function mapPostRowToDashboardPost(row: PostRow): Post {
  return {
    ...row,
    title: row.title || undefined,
    caption: row.caption ?? row.body,
    scheduled_date: row.scheduled_date ?? undefined,
    scheduled_time: row.scheduled_time ?? undefined,
  };
}

function mapAIRecord(row: {
  id: string;
  action: string;
  input_text: string;
  output_text: string;
  created_at: string;
}): DashboardAIRecord {
  return {
    id: row.id,
    action: row.action,
    input_text: row.input_text,
    output_text: row.output_text,
    created_at: row.created_at,
  };
}

function mapActivity(activity: Activity): DashboardRecentActivity {
  const metadata =
    activity.metadata && typeof activity.metadata === "object"
      ? (activity.metadata as Record<string, unknown>)
      : {};

  return {
    id: activity.id,
    actor_id: activity.actor_id,
    workspace_id: activity.workspace_id,
    scope: activity.workspace_id ? "workspace" : "user",
    action: activity.action,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id,
    metadata,
    created_at: activity.created_at,
  };
}

export async function getDashboardData(options?: {
  workspaceId?: string | null;
}): Promise<DashboardData> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const dashboardUser: DashboardUser = {
    id: user.id,
    email: user.email,
    plan:
      typeof user.metadata?.plan === "string" ? user.metadata.plan : undefined,
  };

  const [userPosts, userAiLogsRaw, userActivitiesRaw, workspaceAccess] =
    await Promise.all([
      listPostsForAuthenticatedUser({ includeAllScopes: true }),
      selectAILogsByUserId(user.id, undefined, 80),
      getUserActivities(user.id, 10),
      listUserWorkspaceAccess(user.id),
    ]);

  const activeWorkspaceIdFromCookie = await resolveActiveWorkspaceIdForUser(user.id);
  const requestedWorkspaceId = options?.workspaceId ?? activeWorkspaceIdFromCookie;
  const userAiLogs: DashboardAIRecord[] = userAiLogsRaw.map(mapAIRecord);
  const selectedWorkspaceAccess = pickActiveWorkspaceAccess(
    workspaceAccess,
    requestedWorkspaceId,
  );
  const userActivities = userActivitiesRaw.map(mapActivity);
  const workspaces = workspaceAccess.map(mapWorkspaceAccess);

  let workspace: DashboardWorkspace | null = null;
  let reports: WorkspaceReport[] = [];
  let workspaceMembers: DashboardWorkspaceMember[] = [];
  let recentActivity: DashboardRecentActivity[] = userActivities;
  let analyticsPosts: Post[] = userPosts;
  let analyticsAiLogs: DashboardAIRecord[] = userAiLogs;
  let userTotalPosts = userPosts.length;
  let workspaceTotalPosts: number | null = null;
  let canInviteWorkspaceMembers = false;
  let canGenerateWorkspaceReports = false;

  if (selectedWorkspaceAccess) {
    const workspaceId = selectedWorkspaceAccess.workspace.id;
    const [workspaceReports, workspaceActivitiesRaw, members, workspaceAnalytics] =
      await Promise.all([
        getWorkspaceReportsForUser(user.id, workspaceId),
        getRecentWorkspaceActivityForUser(user.id, workspaceId, 10),
        listWorkspaceMembersForUser(user.id, workspaceId),
        getWorkspaceAnalyticsForUser(user.id, workspaceId),
      ]);

    workspace = mapWorkspaceAccess(selectedWorkspaceAccess);
    reports = workspaceReports;
    workspaceMembers = members.map(mapWorkspaceMember);
    canInviteWorkspaceMembers =
      workspace.role === "owner" || workspace.role === "admin";
    canGenerateWorkspaceReports = canInviteWorkspaceMembers;
    analyticsPosts = workspaceAnalytics.posts.map(mapPostRowToDashboardPost);
    analyticsAiLogs = workspaceAnalytics.ai_logs.map(mapAIRecord);
    userTotalPosts = workspaceAnalytics.user_total_posts;
    workspaceTotalPosts = workspaceAnalytics.workspace_total_posts;

    recentActivity = [...workspaceActivitiesRaw.map(mapActivity), ...userActivities]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20);
  }

  const statusCounts = getStatusCounts(analyticsPosts);
  const todayDate = asDateOnly(new Date().toISOString());
  const upcomingPosts = [...analyticsPosts]
    .filter((post) => {
      if (!post.scheduled_date) {
        return false;
      }
      return post.scheduled_date >= todayDate;
    })
    .sort((a, b) => {
      const aScore = `${a.scheduled_date ?? ""}-${a.scheduled_time ?? "00:00"}`;
      const bScore = `${b.scheduled_date ?? ""}-${b.scheduled_time ?? "00:00"}`;
      return aScore.localeCompare(bScore);
    });

  const postedRatio = analyticsPosts.length
    ? clampInt((statusCounts.posted / analyticsPosts.length) * 100)
    : 0;
  const aiRewriteCount = analyticsAiLogs.filter(
    (log) => log.action === "rewrite_caption",
  ).length;

  const metrics: DashboardMetric[] = workspace
    ? [
        {
          label: "Your Total Posts",
          value: userTotalPosts,
          helper:
            "All posts created by you, including personal and workspace content.",
        },
        {
          label: "Workspace Posts",
          value: workspaceTotalPosts ?? analyticsPosts.length,
          helper: `${statusCounts.draft} draft / ${statusCounts.planned} planned / ${statusCounts.posted} posted`,
        },
        {
          label: "Workspace Posted Rate",
          value: postedRatio,
          helper: "Percent of workspace posts marked as posted",
        },
        {
          label: "Workspace AI Captions",
          value: aiRewriteCount,
          helper: `${analyticsAiLogs.length} total AI operation(s) by workspace members`,
        },
      ]
    : [
        {
          label: "Total Posts",
          value: analyticsPosts.length,
          helper: `${statusCounts.draft} draft / ${statusCounts.planned} planned / ${statusCounts.posted} posted`,
        },
        {
          label: "Posted Rate",
          value: postedRatio,
          helper: "Percent of posts marked as posted",
        },
        {
          label: "Upcoming",
          value: upcomingPosts.length,
          helper: "Scheduled from today onward",
        },
        {
          label: "AI Captions",
          value: aiRewriteCount,
          helper: `${analyticsAiLogs.length} total AI operation(s) recorded`,
        },
      ];

  const platformBreakdown: DashboardPlatformPoint[] = (
    ["instagram", "linkedin", "twitter"] as PostPlatform[]
  ).map((platform) => ({
    platform,
    label: normalizePlatformLabel(platform),
    count: analyticsPosts.filter((post) => post.platform === platform).length,
  }));

  const weeklySeries = groupPostsIntoWeeklySeries(analyticsPosts, analyticsAiLogs);
  const alerts = buildAlerts(
    statusCounts,
    upcomingPosts.length,
    analyticsAiLogs.length,
  );

  return {
    user: dashboardUser,
    posts: analyticsPosts,
    upcomingPosts,
    metrics,
    weeklySeries,
    platformBreakdown,
    aiLogs: analyticsAiLogs,
    alerts,
    workspace,
    workspaces,
    reports,
    recentActivity,
    workspaceMembers,
    userTotalPosts,
    workspaceTotalPosts,
    canInviteWorkspaceMembers,
    canGenerateWorkspaceReports,
  };
}
