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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onRequestDelete?: (post: Post) => void;
}

// ── ALL LOGIC UNTOUCHED ────────────────────────────────────────────────────────
const statusClasses: Record<Post["status"], string> = {
  draft: "bg-zinc-100 border-zinc-300 text-zinc-900",
  planned: "bg-zinc-200 border-zinc-400 text-zinc-900",
  posted: "bg-black border-black text-white",
};

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
// ─────────────────────────────────────────────────────────────────────────────

const statusStyle: Record<
  Post["status"],
  { bg: string; color: string; border: string; dot: string }
> = {
  draft: {
    bg: "rgba(124,92,252,0.1)",
    color: "#a78bfa",
    border: "rgba(124,92,252,0.28)",
    dot: "#7c5cfc",
  },
  planned: {
    bg: "rgba(77,255,210,0.08)",
    color: "#4dffd2",
    border: "rgba(77,255,210,0.25)",
    dot: "#4dffd2",
  },
  posted: {
    bg: "rgba(52,211,153,0.1)",
    color: "#6ee7b7",
    border: "rgba(52,211,153,0.25)",
    dot: "#34d399",
  },
};

const platformStyle: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  instagram: {
    color: "#f471b5",
    bg: "rgba(244,113,181,0.1)",
    border: "rgba(244,113,181,0.25)",
  },
  linkedin: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
  },
  twitter: {
    color: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.25)",
  },
};

function StatusPill({ status }: { status: Post["status"] }) {
  const s = statusStyle[status] ?? statusStyle.draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.dot,
          boxShadow: `0 0 5px ${s.dot}`,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function PlatformPill({ platform }: { platform: string }) {
  const p = platformStyle[platform] ?? {
    color: "#a78bfa",
    bg: "rgba(124,92,252,0.1)",
    border: "rgba(124,92,252,0.25)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 99,
        background: p.bg,
        color: p.color,
        border: `1px solid ${p.border}`,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        textTransform: "capitalize",
      }}
    >
      {platform}
    </span>
  );
}

// ── Small icon-only action button ──────────────────────────────────────────────
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
        background: active ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? "rgba(124,92,252,0.45)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#c4b5fd" : "#6b6890",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(124,92,252,0.12)";
          e.currentTarget.style.borderColor = "rgba(124,92,252,0.3)";
          e.currentTarget.style.color = "#a78bfa";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "#6b6890";
        }
      }}
    >
      {children}
    </button>
  );
}

export function PostCard({ post, onRequestDelete }: PostCardProps) {
  // ── ALL ORIGINAL LOGIC UNTOUCHED ──
  const [expanded, setExpanded] = useState(false);
  const content = post.caption || post.body;
  const tags = extractTags(content);
  const authorLabel = post.user_id.slice(0, 8);

  // ── NEW: copy caption ──────────────────────────────────────────────────────
  const [captionCopied, setCaptionCopied] = useState(false);

  async function handleCopyCaption() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 1500);
  }

  // ── NEW: download image ────────────────────────────────────────────────────
  async function handleDownloadImage() {
    if (!post.image_url) return;
    try {
      const res = await fetch(post.image_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = blob.type.split("/")[1] || "jpg";
      a.download = `${(post.title ?? "image").replace(/\s+/g, "-").toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl); 
    } catch {
      // CORS fallback: open in new tab
      window.open(post.image_url, "_blank");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(124,92,252,0.18)" }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: 18,
        padding: 1,
        background:
          "linear-gradient(135deg, rgba(124,92,252,0.3) 0%, rgba(244,113,181,0.1) 50%, rgba(124,92,252,0.06) 100%)",
        position: "relative",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          borderRadius: 17,
          background: "#0f0f1e",
          padding: "22px 20px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top inner glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: 1,
            width: "55%",
            background:
              "linear-gradient(90deg, transparent, rgba(124,92,252,0.4), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* ── HEADER ── */}
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
                  color: "#eeeaf8",
                  fontFamily: "'Syne', sans-serif",
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
                  color: "#4b4870",
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 11,
                color: "#6b6890",
              }}
            >
              <CalendarClock style={{ width: 11, height: 11 }} />
              {formatSchedule(post)}
            </span>
          </div>
        </header>

        {/* ── IMAGE — download button overlaid top-right ── */}
        {post.image_url ? (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <img
              src={post.image_url}
              alt={
                post.title
                  ? `Featured image for ${post.title}`
                  : "Featured image"
              }
              style={{
                height: 180,
                width: "100%",
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid rgba(124,92,252,0.18)",
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
                background: "rgba(7,7,15,0.72)",
                border: "1px solid rgba(124,92,252,0.28)",
                color: "#c4b5fd",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,92,252,0.28)";
                e.currentTarget.style.borderColor = "rgba(124,92,252,0.55)";
                e.currentTarget.style.color = "#eeeaf8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(7,7,15,0.72)";
                e.currentTarget.style.borderColor = "rgba(124,92,252,0.28)";
                e.currentTarget.style.color = "#c4b5fd";
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
              background:
                "linear-gradient(135deg, rgba(124,92,252,0.06) 0%, rgba(244,113,181,0.04) 100%)",
              border: "1px dashed rgba(124,92,252,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#3d3960",
            }}
          >
            No featured image
          </div>
        )}

        {/* ── CONTENT — copy button top-right ── */}
        <section
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
        >
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
                color: "#8b85a8",
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
                  background: "linear-gradient(to top, #0f0f1e, transparent)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {content.length > 220 && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 11,
                fontWeight: 600,
                color: "#7c5cfc",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7c5cfc")}
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "2px 9px",
                    borderRadius: 99,
                    background: "rgba(124,92,252,0.07)",
                    border: "1px solid rgba(124,92,252,0.18)",
                    fontSize: 11,
                    color: "#7c5cfc",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 11, color: "#3d3960" }}>
                No tags detected
              </span>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid rgba(124,92,252,0.1)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Link href={`/posts/${post.id}`}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 13px",
                  borderRadius: 9,
                  background: "rgba(124,92,252,0.08)",
                  border: "1px solid rgba(124,92,252,0.2)",
                  color: "#a78bfa",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(124,92,252,0.15)";
                  e.currentTarget.style.color = "#c4b5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(124,92,252,0.08)";
                  e.currentTarget.style.color = "#a78bfa";
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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 13px",
                  borderRadius: 9,
                  background:
                    post.status === "posted"
                      ? "rgba(52,211,153,0.06)"
                      : "rgba(77,255,210,0.07)",
                  border: `1px solid ${post.status === "posted" ? "rgba(52,211,153,0.15)" : "rgba(77,255,210,0.2)"}`,
                  color: post.status === "posted" ? "#34d399" : "#4dffd2",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: post.status === "posted" ? "not-allowed" : "pointer",
                  opacity: post.status === "posted" ? 0.5 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (post.status !== "posted")
                    e.currentTarget.style.background = "rgba(77,255,210,0.13)";
                }}
                onMouseLeave={(e) => {
                  if (post.status !== "posted")
                    e.currentTarget.style.background = "rgba(77,255,210,0.07)";
                }}
              >
                <Send style={{ width: 12, height: 12 }} />
                Publish
              </button>
            </form>
          </div>

          <button
            onClick={() => onRequestDelete?.(post)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 13px",
              borderRadius: 9,
              background: "transparent",
              border: "1px solid rgba(248,113,113,0.15)",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(248,113,113,0.15)";
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
