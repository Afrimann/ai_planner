import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { listPostsForAuthenticatedUser } from "@/lib/posts";
import { selectAILogsByUserId } from "@/supabase/client";
import type { Post, PostPlatform, PostStatus } from "@/types";

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

export interface DashboardData {
  user: DashboardUser;
  posts: Post[];
  upcomingPosts: Post[];
  metrics: DashboardMetric[];
  weeklySeries: DashboardSeriesPoint[];
  platformBreakdown: DashboardPlatformPoint[];
  aiLogs: DashboardAIRecord[];
  alerts: DashboardAlert[];
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

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dashboardUser: DashboardUser = {
    id: user.id,
    email: user.email,
    plan:
      typeof user.metadata?.plan === "string" ? user.metadata.plan : undefined,
  };

  const [posts, aiLogsRaw] = await Promise.all([
    listPostsForAuthenticatedUser(),
    selectAILogsByUserId(user.id, 80),
  ]);

  const aiLogs: DashboardAIRecord[] = aiLogsRaw.map((row) => ({
    id: row.id,
    action: row.action,
    input_text: row.input_text,
    output_text: row.output_text,
    created_at: row.created_at,
  }));

  const statusCounts = getStatusCounts(posts);
  const todayDate = asDateOnly(new Date().toISOString());
  const upcomingPosts = [...posts]
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

  const postedRatio = posts.length
    ? clampInt((statusCounts.posted / posts.length) * 100)
    : 0;
  const aiRewriteCount = aiLogs.filter(
    (log) => log.action === "rewrite_caption",
  ).length;

  const metrics: DashboardMetric[] = [
    {
      label: "Total Posts",
      value: posts.length,
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
      helper: `${aiLogs.length} total AI operation(s) recorded`,
    },
  ];

  const platformBreakdown: DashboardPlatformPoint[] = (
    ["instagram", "linkedin", "twitter"] as PostPlatform[]
  ).map((platform) => ({
    platform,
    label: normalizePlatformLabel(platform),
    count: posts.filter((post) => post.platform === platform).length,
  }));

  const weeklySeries = groupPostsIntoWeeklySeries(posts, aiLogs);
  const alerts = buildAlerts(statusCounts, upcomingPosts.length, aiLogs.length);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    posts,
    upcomingPosts,
    metrics,
    weeklySeries,
    platformBreakdown,
    aiLogs,
    alerts,
  };
}
