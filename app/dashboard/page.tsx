import Link from "next/link";

import {
  DashboardCreateReportForm,
  DashboardCreateWorkspaceForm,
  DashboardInviteForm,
} from "@/app/dashboard/DashboardActionForms";
import type {
  DashboardData,
  DashboardRecentActivity,
} from "@/lib/dashboard";
import { getDashboardData } from "@/lib/dashboard";

type DashboardPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function formatRelativeTime(isoDate: string): string {
  const target = new Date(isoDate).getTime();
  if (!Number.isFinite(target)) {
    return "Just now";
  }

  const diffMs = target - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  return rtf.format(Math.round(diffMs / day), "day");
}

function formatActivityTitle(activity: DashboardRecentActivity): string {
  const metadata = activity.metadata ?? {};

  switch (activity.action) {
    case "post_created":
      return "You created a post.";
    case "post_scheduled":
      return "Your post is scheduled soon.";
    case "post_published":
      return "Your post was marked as published.";
    case "invite_member": {
      const invitedEmail =
        typeof metadata.email === "string" ? metadata.email : "a teammate";
      return `A member invited ${invitedEmail} to the workspace.`;
    }
    case "report_created": {
      const reportTitle =
        typeof metadata.title === "string" ? metadata.title : "a report";
      return `Report created: ${reportTitle}.`;
    }
    default:
      return activity.action
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function storageUsageLabel(posts: DashboardData["posts"]): string {
  const estimatedBytes = posts.reduce((acc, post) => {
    return acc + (post.body?.length ?? 0) + (post.caption?.length ?? 0);
  }, 0);
  const kb = Math.max(1, Math.round(estimatedBytes / 1024));

  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  return `${kb} KB`;
}

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function formatDashboardLoadError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    const lower = message.toLowerCase();

    if (
      lower.includes("fetch failed") ||
      lower.includes("connect timeout") ||
      lower.includes("und_err_connect_timeout")
    ) {
      return "Dashboard data could not load because the server connection timed out. Check your internet and refresh.";
    }

    if (message === "Unauthorized") {
      return "Your session has expired. Sign in again.";
    }

    return message || "Dashboard data could not be loaded right now.";
  }

  return "Dashboard data could not be loaded right now.";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardPageSearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const requestedWorkspaceId = readParam(params, "workspace");

  let data: DashboardData | null = null;
  let dashboardLoadError: string | null = null;

  try {
    data = await getDashboardData({
      workspaceId: requestedWorkspaceId,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    dashboardLoadError = formatDashboardLoadError(error);
  }

  if (!data) {
    const retryHref = requestedWorkspaceId
      ? `/dashboard?workspace=${requestedWorkspaceId}`
      : "/dashboard";

    return (
      <section
        style={{
          minHeight: "100%",
          padding: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "min(560px, 100%)",
            border: "1px solid hsl(var(--border))",
            borderRadius: 14,
            background: "hsl(var(--card))",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, color: "hsl(var(--foreground))" }}>
            Dashboard temporarily unavailable
          </h1>
          <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: 14 }}>
            {dashboardLoadError ?? "Dashboard data could not be loaded right now."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={retryHref}
              style={{
                textDecoration: "none",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                padding: "10px 13px",
                fontSize: 13,
                fontWeight: 500,
                color: "hsl(var(--foreground))",
                background: "hsl(var(--background))",
              }}
            >
              Retry
            </Link>
            <Link
              href="/settings"
              style={{
                textDecoration: "none",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                padding: "10px 13px",
                fontSize: 13,
                fontWeight: 500,
                color: "hsl(var(--foreground))",
                background: "hsl(var(--background))",
              }}
            >
              Open Settings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const hasMetrics = data.metrics.length > 0;
  const workspace = data.workspace;
  const activeWorkspaceMembers = data.workspaceMembers.filter(
    (member) => member.status === "active",
  ).length;

  const totalProjects = workspace
    ? data.workspaceTotalPosts ?? data.posts.length
    : data.userTotalPosts;
  const activeUsers = workspace
    ? Math.max(activeWorkspaceMembers, 1)
    : Math.max(new Set(data.posts.map((post) => post.user_id)).size, 1);
  const storageUsed = storageUsageLabel(data.posts);

  return (
    <>
      <style>{`
        .dash-root {
          padding: 28px;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .dash-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
        }

        .dash-eyebrow {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          font-weight: 600;
        }

        .dash-title {
          margin: 4px 0 0;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 700;
          color: hsl(var(--foreground));
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .dash-subtitle {
          margin: 10px 0 0;
          font-size: 14px;
          color: hsl(var(--muted-foreground));
          max-width: 760px;
        }

        .dash-workspace-pill {
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .dash-workspace-switcher {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dash-workspace-link {
          text-decoration: none;
          border: 1px solid hsl(var(--border));
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          background: hsl(var(--background));
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .dash-workspace-link.active,
        .dash-workspace-link:hover {
          border-color: hsl(var(--foreground) / 0.3);
          color: hsl(var(--foreground));
        }

        .dash-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .dash-action-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          text-decoration: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 13px;
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .dash-action-link:hover {
          transform: translateY(-1px);
          border-color: hsl(var(--foreground) / 0.26);
          box-shadow: 0 8px 20px -14px rgb(0 0 0 / 0.35);
        }

        .dash-panel {
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          background: hsl(var(--card));
          padding: 16px;
        }

        .dash-panel-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .dash-panel-subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          color: hsl(var(--muted-foreground));
        }

        .dash-invite-form {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .dash-input,
        .dash-select {
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 10px;
          font-size: 13px;
          padding: 10px 12px;
          outline: none;
        }

        .dash-input {
          min-width: 220px;
          flex: 1 1 240px;
        }

        .dash-select {
          min-width: 120px;
        }

        .dash-button {
          border: 1px solid hsl(var(--foreground));
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 14px;
          cursor: pointer;
        }

        .dash-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .dash-metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .dash-metric-card {
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          background: hsl(var(--card));
          padding: 16px;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
        }

        .dash-metric-card:hover {
          transform: translateY(-2px);
          border-color: hsl(var(--foreground) / 0.25);
          box-shadow: 0 8px 20px -14px rgb(0 0 0 / 0.35);
        }

        .dash-metric-label {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          font-weight: 600;
        }

        .dash-metric-value {
          margin: 10px 0 0;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.04em;
          color: hsl(var(--foreground));
          font-weight: 700;
        }

        .dash-metric-helper {
          margin: 8px 0 0;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          line-height: 1.45;
        }

        .dash-empty {
          border: 1px dashed hsl(var(--border));
          border-radius: 14px;
          background: hsl(var(--card));
          padding: 24px;
          text-align: center;
        }

        .dash-empty-title {
          margin: 0;
          color: hsl(var(--foreground));
          font-size: 20px;
          font-weight: 600;
        }

        .dash-empty-text {
          margin: 8px 0 0;
          color: hsl(var(--muted-foreground));
          font-size: 14px;
        }

        .dash-empty-actions {
          margin-top: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .dash-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .dash-summary-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .dash-summary-item {
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          padding: 10px;
          background: hsl(var(--background));
        }

        .dash-summary-label {
          margin: 0;
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .dash-summary-value {
          margin: 8px 0 0;
          font-size: 22px;
          color: hsl(var(--foreground));
          font-weight: 700;
          line-height: 1;
        }

        .dash-table {
          margin-top: 12px;
          width: 100%;
          border-collapse: collapse;
        }

        .dash-table th,
        .dash-table td {
          padding: 10px 8px;
          border-bottom: 1px solid hsl(var(--border));
          text-align: left;
          font-size: 12px;
          color: hsl(var(--foreground));
        }

        .dash-table th {
          color: hsl(var(--muted-foreground));
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 600;
        }

        .dash-activity-list {
          margin: 12px 0 0;
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dash-activity-item {
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          padding: 10px 12px;
          background: hsl(var(--background));
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dash-activity-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: start;
        }

        .dash-activity-title {
          margin: 0;
          font-size: 13px;
          color: hsl(var(--foreground));
          font-weight: 500;
          line-height: 1.45;
        }

        .dash-activity-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: hsl(var(--muted-foreground));
        }

        .dash-activity-scope {
          border: 1px solid hsl(var(--border));
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        @media (max-width: 1100px) {
          .dash-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .dash-root {
            padding: 20px 14px;
          }

          .dash-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="dash-root">
        <header className="dash-header">
          <div>
            <p className="dash-eyebrow">Overview</p>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">
              Track personal and workspace activity, manage collaboration, and
              monitor reporting from one place.
            </p>
          </div>
          <div>
            {workspace ? (
              <p className="dash-workspace-pill">
                Workspace: {workspace.name} ({workspace.role})
              </p>
            ) : (
              <p className="dash-workspace-pill">Personal workspace mode</p>
            )}
          </div>
        </header>

        {data.workspaces.length > 1 ? (
          <div className="dash-workspace-switcher">
            {data.workspaces.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard?workspace=${item.id}`}
                className={`dash-workspace-link ${workspace?.id === item.id ? "active" : ""}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="dash-actions">
          <Link href="/posts" className="dash-action-link">
            + Create Project
          </Link>
          <a href="#reports" className="dash-action-link">
            View Reports
          </a>
          <Link href="/settings" className="dash-action-link">
            Workspace Settings
          </Link>
        </div>

        {workspace ? (
          <section className="dash-panel">
            <h2 className="dash-panel-title">Invite Member</h2>
            <p className="dash-panel-subtitle">
              Invite teammates by email. Pending invites are activated when they
              sign in.
            </p>
            {data.canInviteWorkspaceMembers ? (
              <DashboardInviteForm workspaceId={workspace.id} />
            ) : (
              <p className="dash-panel-subtitle">
                Only workspace admins can invite members.
              </p>
            )}
          </section>
        ) : (
          <section className="dash-empty">
            <h2 className="dash-empty-title">You're not part of a workspace yet.</h2>
            <p className="dash-empty-text">
              You can still use personal features. Join or create a workspace to
              collaborate with teammates.
            </p>
            <div className="dash-empty-actions">
              <DashboardCreateWorkspaceForm />
              <Link href="/workspace" className="dash-action-link ">
                Join Workspace
              </Link>
            </div>
          </section>
        )}

        {hasMetrics ? (
          <div className="dash-metric-grid">
            {data.metrics.map((metric) => (
              <article key={metric.label} className="dash-metric-card">
                <p className="dash-metric-label">{metric.label}</p>
                <p className="dash-metric-value">{metric.value}</p>
                <p className="dash-metric-helper">{metric.helper}</p>
              </article>
            ))}
          </div>
        ) : (
          <section className="dash-empty">
            <h2 className="dash-empty-title">No metrics yet</h2>
            <p className="dash-empty-text">
              Start creating posts to populate your dashboard analytics.
            </p>
            <div className="dash-empty-actions">
              <Link href="/posts" className="dash-action-link">
                Create First Post
              </Link>
            </div>
          </section>
        )}

        <div className="dash-bottom-grid">
          <section className="dash-panel">
            <h2 className="dash-panel-title">Workspace Summary</h2>
            <p className="dash-panel-subtitle">
              {workspace
                ? `Current workspace snapshot for ${workspace.name}.`
                : "Personal workspace snapshot."}
            </p>
            <div className="dash-summary-grid">
              <div className="dash-summary-item">
                <p className="dash-summary-label">Total Projects</p>
                <p className="dash-summary-value">{totalProjects}</p>
              </div>
              <div className="dash-summary-item">
                <p className="dash-summary-label">Active Users</p>
                <p className="dash-summary-value">{activeUsers}</p>
              </div>
              <div className="dash-summary-item">
                <p className="dash-summary-label">Storage Used</p>
                <p className="dash-summary-value">{storageUsed}</p>
              </div>
            </div>
          </section>

          <section className="dash-panel" id="reports">
            <h2 className="dash-panel-title">Reports</h2>
            <p className="dash-panel-subtitle">
              {workspace
                ? "Workspace analytics reports with downloadable PDF snapshots."
                : "Reports are available when you join a workspace."}
            </p>
            {workspace && data.canGenerateWorkspaceReports ? (
              <DashboardCreateReportForm workspaceId={workspace.id} />
            ) : null}
            {workspace && !data.canGenerateWorkspaceReports ? (
              <p className="dash-panel-subtitle" style={{ marginTop: 12 }}>
                Only workspace admins can generate reports.
              </p>
            ) : null}
            {workspace && data.reports.length > 0 ? (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Created By</th>
                    <th>Created</th>
                    {data.canGenerateWorkspaceReports ? <th>Download</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{report.type}</td>
                      <td>{report.created_by.slice(0, 8)}</td>
                      <td>{new Date(report.created_at).toLocaleString()}</td>
                      {data.canGenerateWorkspaceReports ? (
                        <td>
                          <a
                            href={`/api/workspaces/${workspace.id}/reports/${report.id}/download`}
                            className="dash-action-link"
                            style={{ padding: "6px 10px", fontSize: 12 }}
                          >
                            PDF
                          </a>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="dash-panel-subtitle" style={{ marginTop: 12 }}>
                No reports found for this workspace.
              </p>
            )}
          </section>
        </div>

        <section className="dash-panel">
          <h2 className="dash-panel-title">Recent Activity</h2>
          <p className="dash-panel-subtitle">
            Combined personal and workspace timeline.
          </p>

          {data.recentActivity.length > 0 ? (
            <ul className="dash-activity-list">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="dash-activity-item">
                  <div className="dash-activity-head">
                    <p className="dash-activity-title">
                      {formatActivityTitle(activity)}
                    </p>
                    <div className="dash-activity-meta">
                      <span className="dash-activity-scope">
                        {activity.scope === "workspace" ? "Workspace" : "Personal"}
                      </span>
                      <span>{formatRelativeTime(activity.created_at)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-panel-subtitle" style={{ marginTop: 12 }}>
              No recent activity yet.
            </p>
          )}
        </section>
      </section>
    </>
  );
}
