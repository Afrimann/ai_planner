"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  Copy,
  Download,
  Pencil,
  Send,
  Trash2,
  User,
} from "lucide-react";

import { markPostAsPostedAction } from "@/app/posts/actions";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
  onRequestDelete?: (post: Post) => void;
}

function formatSchedule(post: Post): string {
  if (!post.scheduled_date) return "Not scheduled";
  const dateValue = new Date(
    `${post.scheduled_date}T${post.scheduled_time ?? "00:00"}`,
  );

  return dateValue.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function extractTags(caption: string): string[] {
  return Array.from(
    new Set(
      caption
        .split(/\s+/)
        .filter((token) => token.startsWith("#"))
        .map((token) => token.replace(/[^\w#-]/g, "").slice(0, 24))
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

const statusStyle: Record<
  Post["status"],
  { bg: string; color: string; border: string; dot: string }
> = {
  draft: {
    bg: "hsl(var(--muted))",
    color: "hsl(var(--foreground))",
    border: "hsl(var(--border))",
    dot: "hsl(var(--muted-foreground))",
  },
  planned: {
    bg: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    border: "hsl(var(--foreground) / 0.3)",
    dot: "hsl(var(--foreground))",
  },
  posted: {
    bg: "hsl(var(--foreground))",
    color: "hsl(var(--background))",
    border: "hsl(var(--foreground))",
    dot: "hsl(var(--background))",
  },
};

const platformStyle: Record<string, { color: string; bg: string; border: string }> = {
  instagram: {
    color: "hsl(var(--foreground))",
    bg: "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  linkedin: {
    color: "hsl(var(--foreground))",
    bg: "hsl(var(--background))",
    border: "hsl(var(--foreground) / 0.3)",
  },
  twitter: {
    color: "hsl(var(--background))",
    bg: "hsl(var(--foreground))",
    border: "hsl(var(--foreground))",
  },
};

function StatusPill({ status }: { status: Post["status"] }) {
  const style = statusStyle[status] ?? statusStyle.draft;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "Poppins, sans-serif",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: style.dot,
          boxShadow: `0 0 5px ${style.dot}`,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function PlatformPill({ platform }: { platform: string }) {
  const style = platformStyle[platform] ?? {
    color: "hsl(var(--foreground))",
    bg: "hsl(var(--muted))",
    border: "hsl(var(--border))",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 99,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "Poppins, sans-serif",
        textTransform: "capitalize",
      }}
    >
      {platform}
    </span>
  );
}

function IconBtn({
  onClick,
  title,
  active = false,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 7,
        flexShrink: 0,
        background: active ? "hsl(var(--foreground))" : "hsl(var(--muted))",
        border: `1px solid ${active ? "hsl(var(--foreground))" : "hsl(var(--border))"}`,
        color: active
          ? "hsl(var(--background))"
          : "hsl(var(--muted-foreground))",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(event) => {
        if (!active) {
          event.currentTarget.style.background = "hsl(var(--accent))";
          event.currentTarget.style.borderColor = "hsl(var(--foreground) / 0.3)";
          event.currentTarget.style.color = "hsl(var(--foreground))";
        }
      }}
      onMouseLeave={(event) => {
        if (!active) {
          event.currentTarget.style.background = "hsl(var(--muted))";
          event.currentTarget.style.borderColor = "hsl(var(--border))";
          event.currentTarget.style.color = "hsl(var(--muted-foreground))";
        }
      }}
    >
      {children}
    </button>
  );
}

export function PostCard({ post, onRequestDelete }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const content = post.caption || post.body;
  const tags = extractTags(content);
  const authorLabel = post.user_id.slice(0, 8);

  async function handleCopyCaption() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 1500);
  }

  async function handleDownloadImage() {
    if (!post.image_url) return;

    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      const ext = blob.type.split("/")[1] || "jpg";
      anchor.download = `${(post.title ?? "image")
        .replace(/\s+/g, "-")
        .toLowerCase()}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(post.image_url, "_blank");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="card"
      style={{
        position: "relative",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        className="p-4 sm:p-5"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "hsl(var(--foreground))",
                  fontFamily: "Poppins, sans-serif",
                  letterSpacing: "-0.02em",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {post.title || "Untitled post"}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <User style={{ width: 12, height: 12 }} />
                  {authorLabel}
                </span>
                <span>
                  Updated{" "}
                  {new Date(post.updated_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            </div>
            <StatusPill status={post.status} />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
            }}
          >
            <PlatformPill platform={post.platform} />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 99,
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                fontSize: 11,
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <CalendarClock style={{ width: 11, height: 11 }} />
              {formatSchedule(post)}
            </span>
          </div>
        </header>

        {post.image_url ? (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <img
              src={post.image_url}
              alt={
                post.title ? `Featured image for ${post.title}` : "Featured image"
              }
              style={{
                height: 180,
                width: "100%",
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid hsl(var(--border))",
                display: "block",
              }}
            />
            <button
              type="button"
              title="Download image"
              onClick={handleDownloadImage}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 8,
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "Poppins, sans-serif",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "hsl(var(--muted))";
                event.currentTarget.style.borderColor = "hsl(var(--ring))";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "hsl(var(--card))";
                event.currentTarget.style.borderColor = "hsl(var(--border))";
              }}
            >
              <Download style={{ width: 12, height: 12 }} />
              Download
            </button>
          </div>
        ) : (
          <div
            style={{
              marginBottom: 16,
              height: 140,
              borderRadius: 12,
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            No featured image
          </div>
        )}

        <section style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
              <IconBtn
                onClick={handleCopyCaption}
                title={captionCopied ? "Copied!" : "Copy caption"}
                active={captionCopied}
              >
                {captionCopied ? (
                  <Check style={{ width: 13, height: 13 }} />
                ) : (
                  <Copy style={{ width: 13, height: 13 }} />
                )}
              </IconBtn>
            </div>

            <p
              style={{
                margin: 0,
                paddingRight: 36,
                fontSize: 13,
                lineHeight: 1.7,
                color: "hsl(var(--foreground))",
                whiteSpace: "pre-wrap",
                display: !expanded ? "-webkit-box" : "block",
                WebkitLineClamp: !expanded ? 4 : undefined,
                WebkitBoxOrient: !expanded ? "vertical" : undefined,
                overflow: !expanded ? "hidden" : "visible",
              }}
            >
              {content}
            </p>

            {!expanded && content.length > 220 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 36,
                  width: "100%",
                  background:
                    "linear-gradient(to top, hsl(var(--card)), transparent)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {content.length > 220 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 11,
                fontWeight: 600,
                color: "hsl(var(--foreground))",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "Poppins, sans-serif",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = "hsl(var(--muted-foreground))";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = "hsl(var(--foreground))";
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "2px 9px",
                    borderRadius: 99,
                    background: "hsl(var(--muted))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 11,
                    color: "hsl(var(--foreground))",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                No tags detected
              </span>
            )}
          </div>
        </section>

        <footer
          className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap gap-2">
            <Link href={`/posts/${post.id}`}>
              <button
                type="button"
                className="w-full justify-center sm:w-auto"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 13px",
                  borderRadius: 9,
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "Poppins, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "hsl(var(--accent))";
                  event.currentTarget.style.borderColor =
                    "hsl(var(--foreground) / 0.25)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "hsl(var(--muted))";
                  event.currentTarget.style.borderColor = "hsl(var(--border))";
                }}
              >
                <Pencil style={{ width: 12, height: 12 }} />
                Edit
              </button>
            </Link>

            <form action={markPostAsPostedAction}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                disabled={post.status === "posted"}
                className="w-full justify-center sm:w-auto"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 13px",
                  borderRadius: 9,
                  background:
                    post.status === "posted"
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted))",
                  border: `1px solid ${
                    post.status === "posted"
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--border))"
                  }`,
                  color:
                    post.status === "posted"
                      ? "hsl(var(--background))"
                      : "hsl(var(--foreground))",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "Poppins, sans-serif",
                  cursor: post.status === "posted" ? "not-allowed" : "pointer",
                  opacity: post.status === "posted" ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  if (post.status !== "posted") {
                    event.currentTarget.style.background = "hsl(var(--accent))";
                    event.currentTarget.style.borderColor =
                      "hsl(var(--foreground) / 0.3)";
                  }
                }}
                onMouseLeave={(event) => {
                  if (post.status !== "posted") {
                    event.currentTarget.style.background = "hsl(var(--muted))";
                    event.currentTarget.style.borderColor = "hsl(var(--border))";
                  }
                }}
              >
                <Send style={{ width: 12, height: 12 }} />
                Publish
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => onRequestDelete?.(post)}
            className="w-full justify-center sm:w-auto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 13px",
              borderRadius: 9,
              background: "transparent",
              border: "1px solid hsl(var(--destructive) / 0.2)",
              color: "hsl(var(--destructive))",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "Poppins, sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "hsl(var(--destructive) / 0.08)";
              event.currentTarget.style.borderColor =
                "hsl(var(--destructive) / 0.35)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.borderColor =
                "hsl(var(--destructive) / 0.2)";
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
            Delete
          </button>
        </footer>
      </div>
    </motion.article>
  );
}

