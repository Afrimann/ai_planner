"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { PostForm } from "@/components/posts/PostForm";
import { PostList } from "@/components/posts/PostList";
import type { Post } from "@/types";

interface PostsPageClientProps {
  posts: Post[];
}

export function PostsPageClient({ posts }: PostsPageClientProps) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Floating "New Post" toggle — only shown here when PostList is primary */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 10,
            background: formOpen
              ? "rgba(248,113,113,0.08)"
              : "linear-gradient(135deg, #7c5cfc 0%, #6d4fe0 100%)",
            border: formOpen ? "1px solid rgba(248,113,113,0.25)" : "none",
            color: formOpen ? "#f87171" : "#fff",
            fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            boxShadow: formOpen ? "none" : "0 4px 16px rgba(124,92,252,0.38)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!formOpen) e.currentTarget.style.boxShadow = "0 6px 24px rgba(124,92,252,0.55)";
          }}
          onMouseLeave={(e) => {
            if (!formOpen) e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,92,252,0.38)";
          }}
        >
          {formOpen
            ? <><X style={{ width: 14, height: 14 }} /> Close Form</>
            : <><Plus style={{ width: 14, height: 14 }} /> New Post</>
          }
        </button>
      </div>

      {/* PostForm — slides in/out above the list */}
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
            <div style={{
              display: "flex", justifyContent: "flex-end",
              marginBottom: 8,
            }}>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#6b6890", fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#6b6890";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <X style={{ width: 11, height: 11 }} />
                Close form
              </button>
            </div>
            <PostForm />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PostList — always visible */}
      <PostList posts={posts} />
    </div>
  );
}