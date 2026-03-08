import Link from "next/link";
import { ChevronRight, FileText, Wand } from "lucide-react";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { listPostsForAuthenticatedUser } from "@/lib/posts";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";
import { PostsPageClient } from "./PostPageClient";

const PAGE_STYLES = `
  .nexus-stat-card {
    border-radius: 8px;
    padding: 20px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nexus-stat-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }

  .nexus-breadcrumb a {
    color: hsl(var(--muted-foreground));
    text-decoration: none;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nexus-breadcrumb a:hover { color: hsl(var(--foreground)); }
  .nexus-breadcrumb span {
    color: hsl(var(--foreground));
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
  }
`;

export default async function PostsPage() {
  const user = await getCurrentAuthenticatedUser();
  const workspaceId = user
    ? await resolveActiveWorkspaceIdForUser(user.id)
    : null;
  const posts = await listPostsForAuthenticatedUser();

  // ── ALL LOGIC UNTOUCHED ──
  const upcomingCount = posts.filter((post) => {
    if (!post.scheduled_date) return false;
    return post.scheduled_date >= new Date().toISOString().slice(0, 10);
  }).length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <>
      <style>{PAGE_STYLES}</style>

      <section
        className="flex min-h-full flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 sm:py-8"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="nexus-breadcrumb"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Link href="/dashboard">Dashboard</Link>
          <ChevronRight
            style={{
              width: 13,
              height: 13,
              color: "hsl(var(--muted-foreground))",
              flexShrink: 0,
            }}
          />
          <span>Posts</span>
        </nav>

        <header className="card">
          <div
            style={{
              padding: "20px 16px 18px",
              position: "relative",
              overflow: "hidden",
            }}
            className="sm:px-6 sm:py-6"
          >
            {/* Title + secondary actions */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  Content
                </p>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "hsl(var(--foreground))",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Post Management
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                    fontWeight: 400,
                    lineHeight: 1.5,
                  }}
                >
                  Create, schedule, publish, and organize all posts in a single
                  workflow.
                </p>
              </div>

              {/* Secondary nav actions (no New Post here — it's in the client) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a
                  href="#post-list"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Poppins', sans-serif",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FileText style={{ width: 15, height: 15 }} />
                  View List
                </a>
                <a
                  href="#post-list"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "Poppins, sans-serif",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Wand style={{ width: 15, height: 15 }} />
                  AI Tools
                </a>
              </div>
            </div>

            {/* Stat cards */}
            <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 14,
            }}
          >
              <StatCard
                label="Total Posts"
                value={posts.length}
                helper="All statuses"
              />
              <StatCard
                label="Upcoming"
                value={upcomingCount}
                helper="Scheduled ahead"
              />
              <StatCard
                label="Drafts"
                value={draftCount}
                helper="Pending review"
              />
            </div>
          </div>
        </header>

        {/* Client section: toggleable PostForm + always-visible PostList */}
        <PostsPageClient posts={posts} workspaceId={workspaceId} />
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="nexus-stat-card">
      <div className="nexus-stat-inner">
        <div className="nexus-stat-blob" />
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "0 0 6px",
            fontFamily: "'Poppins', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "hsl(var(--foreground))",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "hsl(var(--muted-foreground))",
            fontWeight: 300,
          }}
        >
          {helper}
        </p>
      </div>
    </article>
  );
}

