import { createActivity } from "@/lib/activities";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { getWorkspaceAnalyticsForUser } from "@/lib/workspace-analytics";
import {
  requireWorkspaceAdminOrOwner,
  requireWorkspaceForUser,
} from "@/lib/workspaces";
import {
  insertReport,
  selectReportByIdAndWorkspaceId,
  selectReportsByWorkspaceId,
} from "@/supabase/client";

export interface WorkspaceReport {
  id: string;
  workspace_id: string;
  title: string;
  type: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceReportMemberInsight {
  user_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  total_posts: number;
  posted_posts: number;
  planned_posts: number;
  draft_posts: number;
  ai_usage_count: number;
}

export interface WorkspaceReportTimelineInsight {
  key: string;
  label: string;
  total_posts: number;
  posted_posts: number;
  planned_posts: number;
  draft_posts: number;
  ai_usage_count: number;
}

export interface WorkspaceReportInsights {
  workspace_id: string;
  workspace_name: string;
  report_id: string;
  report_title: string;
  report_type: string;
  generated_at: string;
  user_total_posts: number;
  workspace_total_posts: number;
  workspace_total_ai_usage: number;
  active_member_count: number;
  members: WorkspaceReportMemberInsight[];
  timeline: WorkspaceReportTimelineInsight[];
}

function mapWorkspaceReport(row: {
  id: string;
  workspace_id: string;
  title: string;
  type: string;
  created_by: string;
  created_at: string;
}): WorkspaceReport {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    title: row.title,
    type: row.type,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

function sanitizeFileNamePart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "report";
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxChars: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    const candidate = `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildPdfContentStream(lines: string[]): string {
  const commands = ["BT", "/F1 10 Tf", "14 TL", "48 792 Td"];

  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push("T*");
  }

  commands.push("ET");
  return commands.join("\n");
}

function buildPdfDocument(lines: string[]): Uint8Array {
  const wrappedLines: string[] = [];
  for (const line of lines) {
    wrappedLines.push(...wrapLine(line, 100));
  }

  const linesPerPage = 52;
  const pages: string[][] = [];
  for (let start = 0; start < wrappedLines.length; start += linesPerPage) {
    pages.push(wrappedLines.slice(start, start + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(["Workspace report"]);
  }

  const totalObjects = 3 + pages.length * 2;
  const fontObjectNumber = totalObjects;
  const bodies: string[] = new Array(totalObjects + 1);

  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  const kids = pageObjectNumbers.map((value) => `${value} 0 R`).join(" ");

  bodies[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  bodies[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`;

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = buildPdfContentStream(pageLines);

    bodies[pageObjectNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> ` +
      `/Contents ${contentObjectNumber} 0 R >>`;
    bodies[contentObjectNumber] =
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  bodies[fontObjectNumber] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    offsets[objectNumber] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectNumber} 0 obj\n${bodies[objectNumber]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${totalObjects + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    const paddedOffset = `${offsets[objectNumber]}`.padStart(10, "0");
    pdf += `${paddedOffset} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function buildWorkspaceReportLines(insights: WorkspaceReportInsights): string[] {
  const lines: string[] = [];

  lines.push(`Workspace Report: ${insights.report_title}`);
  lines.push(`Workspace: ${insights.workspace_name}`);
  lines.push(`Report Type: ${insights.report_type}`);
  lines.push(`Generated At: ${new Date(insights.generated_at).toLocaleString()}`);
  lines.push("");
  lines.push("Summary");
  lines.push(`- Active members: ${insights.active_member_count}`);
  lines.push(`- Total posts (workspace): ${insights.workspace_total_posts}`);
  lines.push(`- Your total posts: ${insights.user_total_posts}`);
  lines.push(`- Total AI usage (workspace): ${insights.workspace_total_ai_usage}`);
  lines.push("");
  lines.push("Post Changes Over Time (Last 6 Months)");

  for (const point of insights.timeline) {
    lines.push(
      `${point.label}: ${point.total_posts} posts (` +
        `${point.posted_posts} posted, ${point.planned_posts} planned, ` +
        `${point.draft_posts} draft), AI usage ${point.ai_usage_count}`,
    );
  }

  lines.push("");
  lines.push("Member Breakdown");
  for (const member of insights.members) {
    const memberLabel = member.email || `${member.user_id.slice(0, 8)}...`;
    lines.push(
      `${memberLabel} [${member.role}] - posts ${member.total_posts} ` +
        `(${member.posted_posts} posted, ${member.planned_posts} planned, ` +
        `${member.draft_posts} draft), AI usage ${member.ai_usage_count}`,
    );
  }

  return lines;
}

export async function getWorkspaceReportsForUser(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceReport[]> {
  await requireWorkspaceForUser(userId, workspaceId);
  const rows = await selectReportsByWorkspaceId(workspaceId);

  return rows.map(mapWorkspaceReport);
}

export async function getWorkspaceReports(
  workspaceId: string,
): Promise<WorkspaceReport[]> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return getWorkspaceReportsForUser(user.id, workspaceId);
}

export async function createWorkspaceReportForUser(
  userId: string,
  workspaceId: string,
  input: {
    title: string;
    type: string;
  },
): Promise<WorkspaceReport> {
  const title = input.title.trim();
  const type = input.type.trim().toLowerCase();

  if (!title) {
    throw new Error("Report title is required.");
  }
  if (!type) {
    throw new Error("Report type is required.");
  }

  await requireWorkspaceAdminOrOwner(userId, workspaceId);

  const report = await insertReport({
    workspace_id: workspaceId,
    title,
    type,
    created_by: userId,
  });

  await createActivity({
    actorId: userId,
    workspaceId,
    action: "report_created",
    entityType: "report",
    entityId: report.id,
    metadata: {
      title: report.title,
      type: report.type,
    },
  });

  return mapWorkspaceReport(report);
}

export async function createWorkspaceReport(
  workspaceId: string,
  title: string,
  type: string,
): Promise<WorkspaceReport> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return createWorkspaceReportForUser(user.id, workspaceId, { title, type });
}

export async function getWorkspaceReportInsightsForUser(
  userId: string,
  workspaceId: string,
  reportId: string,
): Promise<WorkspaceReportInsights> {
  await requireWorkspaceAdminOrOwner(userId, workspaceId);

  const [report, analytics] = await Promise.all([
    selectReportByIdAndWorkspaceId(reportId, workspaceId),
    getWorkspaceAnalyticsForUser(userId, workspaceId),
  ]);

  if (!report) {
    throw new Error("Report not found for this workspace.");
  }

  return {
    workspace_id: analytics.workspace_id,
    workspace_name: analytics.workspace_name,
    report_id: report.id,
    report_title: report.title,
    report_type: report.type,
    generated_at: new Date().toISOString(),
    user_total_posts: analytics.user_total_posts,
    workspace_total_posts: analytics.workspace_total_posts,
    workspace_total_ai_usage: analytics.workspace_total_ai_usage,
    active_member_count: analytics.active_member_count,
    members: analytics.members,
    timeline: analytics.timeline,
  };
}

export async function buildWorkspaceReportPdfForUser(
  userId: string,
  workspaceId: string,
  reportId: string,
): Promise<{ fileName: string; bytes: Uint8Array }> {
  const insights = await getWorkspaceReportInsightsForUser(
    userId,
    workspaceId,
    reportId,
  );

  const reportDate = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizeFileNamePart(insights.workspace_name)}-${sanitizeFileNamePart(insights.report_title)}-${reportDate}.pdf`;
  const lines = buildWorkspaceReportLines(insights);

  return {
    fileName,
    bytes: buildPdfDocument(lines),
  };
}
