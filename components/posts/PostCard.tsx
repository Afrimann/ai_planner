"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, Pencil, Send, Trash2, User } from "lucide-react";

import { markPostAsPostedAction } from "@/app/posts/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Post } from "@/types";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onRequestDelete?: (post: Post) => void;
}

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

export function PostCard({ post, onRequestDelete }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const content = post.caption || post.body;
  const tags = extractTags(content);
  const authorLabel = post.user_id.slice(0, 8);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl"
    >
      {/* HEADER */}
      <header className="mb-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900">
              {post.title || "Untitled post"}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
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

          <Badge
            className={cn(
              "capitalize px-3 py-1 text-xs",
              statusClasses[post.status],
            )}
          >
            {post.status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className="capitalize">{post.platform}</Badge>

          <Badge className="inline-flex items-center gap-1 text-zinc-600">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatSchedule(post)}
          </Badge>
        </div>
      </header>

      {/* IMAGE */}
      {post.image_url ? (
        <img
          src={post.image_url}
          alt={
            post.title ? `Featured image for ${post.title}` : "Featured image"
          }
          className="mb-5 h-52 w-full rounded-2xl object-cover ring-1 ring-zinc-200"
        />
      ) : (
        <div className="mb-5 flex h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs text-zinc-500">
          No featured image
        </div>
      )}

      {/* CONTENT */}
      <section className="space-y-4">
        <div className="relative">
          <p
            className={cn(
              "whitespace-pre-wrap text-sm leading-6 text-zinc-800 transition-all",
              !expanded && "line-clamp-4",
            )}
          >
            {content}
          </p>

          {!expanded && content.length > 220 && (
            <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-full bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {content.length > 220 && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-medium text-black hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* TAGS */}
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge
                key={tag}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-zinc-400">No tags detected</span>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/posts/${post.id}`}>
            <Button
              variant="secondary"
              className="h-9 px-4 text-xs font-medium"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>

          <form action={markPostAsPostedAction}>
            <input type="hidden" name="id" value={post.id} />
            <Button
              type="submit"
              variant="secondary"
              className="h-9 px-4 text-xs font-medium"
              disabled={post.status === "posted"}
            >
              <Send className="mr-2 h-3.5 w-3.5" />
              Publish
            </Button>
          </form>
        </div>

        <Button
          variant="ghost"
          className="h-9 px-4 text-xs text-red-600 hover:bg-red-50"
          onClick={() => onRequestDelete?.(post)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </Button>
      </footer>
    </motion.article>
  );
}
