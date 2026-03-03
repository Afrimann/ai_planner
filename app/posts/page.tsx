import Link from "next/link";
import { ChevronRight, FileText, Sparkles } from "lucide-react";

import { listPostsForAuthenticatedUser } from "@/lib/posts";
import { PostsPageClient } from "./PostPageClient";

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .nexus-stat-card {
    position: relative;
    border-radius: 14px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(124,92,252,0.3) 0%, rgba(244,113,181,0.1) 100%);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .nexus-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(124,92,252,0.15);
  }
  .nexus-stat-inner {
    border-radius: 13px;
    padding: 18px 20px;
    background: #0d0d1c;
    position: relative;
    overflow: hidden;
  }
  .nexus-stat-inner::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    height: 1px; width: 55%;
    background: linear-gradient(90deg, transparent, rgba(124,92,252,0.45), transparent);
  }
  .nexus-stat-blob {
    position: absolute;
    bottom: -16px; right: -16px;
    width: 64px; height: 64px;
    border-radius: 50%;
    background: rgba(124,92,252,0.07);
    filter: blur(16px);
    pointer-events: none;
  }

  .nexus-breadcrumb a {
    color: #6b6890;
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    transition: color 0.15s ease;
  }
  .nexus-breadcrumb a:hover { color: #a78bfa; }
  .nexus-breadcrumb span {
    color: #c4b5fd;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
  }
`;

export default async function PostsPage() {
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

      <section style={{
        padding: "32px 28px",
        display: "flex", flexDirection: "column", gap: 28,
        fontFamily: "'DM Sans', sans-serif", minHeight: "100%",
      }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="nexus-breadcrumb"
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/dashboard">Dashboard</Link>
          <ChevronRight style={{ width: 13, height: 13, color: "#3d3960", flexShrink: 0 }} />
          <span>Posts</span>
        </nav>

        {/* Header card */}
        <header style={{
          borderRadius: 18, padding: 1,
          background: "linear-gradient(135deg, rgba(124,92,252,0.4) 0%, rgba(244,113,181,0.18) 50%, rgba(124,92,252,0.08) 100%)",
        }}>
          <div style={{
            borderRadius: 17, padding: "28px 28px 24px",
            background: "#0f0f1e", position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden="true" style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              height: 1, width: "60%",
              background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.55), transparent)",
            }} />
            <div aria-hidden="true" style={{
              position: "absolute", top: -40, right: -40,
              width: 160, height: 160, borderRadius: "50%",
              background: "rgba(124,92,252,0.06)", filter: "blur(40px)", pointerEvents: "none",
            }} />

            {/* Title + secondary actions */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "#7c5cfc" }}>
                  Content
                </p>
                <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#eeeaf8", letterSpacing: "-0.03em" }}>
                  Post Management
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "#7a7499", fontWeight: 300, lineHeight: 1.5 }}>
                  Create, schedule, publish, and organize all posts in a single workflow.
                </p>
              </div>

              {/* Secondary nav actions (no New Post here — it's in the client) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a href="#post-list" style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 10,
                  background: "rgba(124,92,252,0.08)", color: "#a78bfa",
                  border: "1px solid rgba(124,92,252,0.2)",
                  fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "none", transition: "all 0.15s ease",
                }}>
                  <FileText style={{ width: 15, height: 15 }} />
                  View List
                </a>
                <a href="#post-list" style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 10,
                  background: "rgba(124,92,252,0.08)", color: "#a78bfa",
                  border: "1px solid rgba(124,92,252,0.2)",
                  fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "none", transition: "all 0.15s ease",
                }}>
                  <Sparkles style={{ width: 15, height: 15 }} />
                  AI Tools
                </a>
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
              <StatCard label="Total Posts" value={posts.length} helper="All statuses" />
              <StatCard label="Upcoming" value={upcomingCount} helper="Scheduled ahead" />
              <StatCard label="Drafts" value={draftCount} helper="Pending review" />
            </div>
          </div>
        </header>

        {/* Client section: toggleable PostForm + always-visible PostList */}
        <PostsPageClient posts={posts} />

      </section>
    </>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <article className="nexus-stat-card">
      <div className="nexus-stat-inner">
        <div className="nexus-stat-blob" />
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6890" }}>
          {label}
        </p>
        <p style={{ margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: "#eeeaf8", letterSpacing: "-0.04em", lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#4b4870", fontWeight: 300 }}>
          {helper}
        </p>
      </div>
    </article>
  );
}