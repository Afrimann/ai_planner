"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { PostForm } from "@/components/posts/PostForm";
import { PostList } from "@/components/posts/PostList";
import type { Post } from "@/types";

interface PostsPageClientProps {
  posts: Post[];
  workspaceId?: string | null;
}

export function PostsPageClient({ posts, workspaceId }: PostsPageClientProps) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Floating "New Post" toggle - only shown here when PostList is primary */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="w-full sm:w-auto"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: 10,
            background: formOpen
              ? "hsl(var(--destructive) / 0.1)"
              : "hsl(var(--foreground))",
            border: formOpen
              ? "1px solid hsl(var(--destructive) / 0.3)"
              : "1px solid hsl(var(--foreground))",
            color: formOpen
              ? "hsl(var(--destructive))"
              : "hsl(var(--background))",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Poppins, sans-serif",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: formOpen ? "none" : "0 6px 16px rgba(0, 0, 0, 0.2)",
          }}
        >
          {formOpen ? (
            <>
              <X style={{ width: 14, height: 14 }} /> Close Form
            </>
          ) : (
            <>
              <Plus style={{ width: 14, height: 14 }} /> New Post
            </>
          )}
        </button>
      </div>

      {/* PostForm - slides in/out above the list */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="post-form"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Close bar at top of form */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                  fontFamily: "Poppins, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "hsl(var(--accent))";
                  event.currentTarget.style.color = "hsl(var(--foreground))";
                  event.currentTarget.style.borderColor =
                    "hsl(var(--foreground) / 0.3)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "hsl(var(--muted))";
                  event.currentTarget.style.color = "hsl(var(--muted-foreground))";
                  event.currentTarget.style.borderColor = "hsl(var(--border))";
                }}
              >
                <X style={{ width: 11, height: 11 }} />
                Close form
              </button>
            </div>
            <PostForm workspaceId={workspaceId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PostList - always visible */}
      <PostList posts={posts} />
    </div>
  );
}
