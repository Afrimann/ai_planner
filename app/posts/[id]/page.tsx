import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { updatePostAction } from "@/app/posts/actions";
import { PostForm } from "@/components/posts/PostForm";
import { getPostById } from "@/lib/posts";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostPageProps) {
  // ── ALL LOGIC UNTOUCHED ──
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) notFound();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .nexus-breadcrumb a {
          color: #6b6890; text-decoration: none;
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          transition: color 0.15s ease;
        }
        .nexus-breadcrumb a:hover { color: #a78bfa; }
        .nexus-breadcrumb span {
          color: #c4b5fd; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
        }
      `}</style>

      <section
        style={{
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          fontFamily: "'DM Sans', sans-serif",
          minHeight: "100%",
        }}
      >
        {/* Breadcrumb — LOGIC UNTOUCHED */}
        <nav
          aria-label="Breadcrumb"
          className="nexus-breadcrumb"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Link href="/dashboard">Dashboard</Link>
          <ChevronRight
            style={{ width: 13, height: 13, color: "#3d3960", flexShrink: 0 }}
          />
          <Link href="/posts">Posts</Link>
          <ChevronRight
            style={{ width: 13, height: 13, color: "#3d3960", flexShrink: 0 }}
          />
          <span>Edit</span>
        </nav>

        {/* Header card */}
        <header
          style={{
            borderRadius: 18,
            padding: 1,
            background:
              "linear-gradient(135deg, rgba(124,92,252,0.4) 0%, rgba(244,113,181,0.18) 50%, rgba(124,92,252,0.08) 100%)",
          }}
        >
          <div
            style={{
              borderRadius: 17,
              padding: "28px 28px 24px",
              background: "#0f0f1e",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top glow line */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: 1,
                width: "60%",
                background:
                  "linear-gradient(90deg, transparent, rgba(124,92,252,0.55), transparent)",
              }}
            />
            {/* Ambient blob */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(244,113,181,0.05)",
                filter: "blur(36px)",
                pointerEvents: "none",
              }}
            />

            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#7c5cfc",
              }}
            >
              Editing
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                color: "#eeeaf8",
                letterSpacing: "-0.03em",
              }}
            >
              Edit Post
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#7a7499",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            >
              Update caption, media, and schedule with the same validation rules
              as create.
            </p>
          </div>
        </header>

        {/* PostForm — LOGIC UNTOUCHED */}
        <PostForm
          mode="edit"
          initialPost={post}
          editAction={updatePostAction}
        />
      </section>
    </>
  );
}
