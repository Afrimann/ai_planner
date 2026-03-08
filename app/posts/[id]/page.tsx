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
        .nexus-breadcrumb a {
          color: hsl(var(--muted-foreground)); text-decoration: none;
          font-family: 'Poppins', sans-serif; font-size: 12px;
          transition: color 0.15s ease;
        }
        .nexus-breadcrumb a:hover { color: hsl(var(--foreground)); }
        .nexus-breadcrumb span {
          color: hsl(var(--foreground)); font-family: 'Poppins', sans-serif;
          font-size: 12px; font-weight: 500;
        }
      `}</style>

      <section
        className="flex min-h-full flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 sm:py-8"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Breadcrumb — LOGIC UNTOUCHED */}
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
          <Link href="/posts">Posts</Link>
          <ChevronRight
            style={{
              width: 13,
              height: 13,
              color: "hsl(var(--muted-foreground))",
              flexShrink: 0,
            }}
          />
          <span>Edit</span>
        </nav>

        {/* Header card */}
        <header className="card">
          <div
            style={{
              padding: "20px 16px 18px",
              position: "relative",
              overflow: "hidden",
            }}
            className="sm:px-6 sm:py-6"
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Editing
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
              Edit Post
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "hsl(var(--muted-foreground))",
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
          workspaceId={post.workspace_id}
          editAction={updatePostAction}
        />
      </section>
    </>
  );
}
