"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

import { PostCard } from "@/components/posts/PostCard";
import { Input } from "@/components/ui/Input";
import type { Post } from "@/types";

interface PostListProps {
  posts: Post[];
}

const LIST_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .nexus-list-search label,
  .nexus-list-search [data-slot="label"],
  .nexus-list-search [class*="label"],
  .nexus-list-search [class*="Label"] {
    color: #d4cfee !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
  }
  .nexus-list-search input {
    background: #05050d !important;
    color: #eeeaf8 !important;
    -webkit-text-fill-color: #eeeaf8 !important;
    border: 1px solid rgba(124,92,252,0.22) !important;
    border-radius: 12px !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 13.5px !important;
    outline: none !important;
    transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  }
  .nexus-list-search input:focus {
    border-color: rgba(124,92,252,0.6) !important;
    box-shadow: 0 0 0 3px rgba(124,92,252,0.12) !important;
  }
  .nexus-list-search input::placeholder {
    color: #3e3a5e !important;
    -webkit-text-fill-color: #3e3a5e !important;
    opacity: 1 !important;
  }

  /* View toggle buttons */
  .nexus-view-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px;
    font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    cursor: pointer; border: 1px solid rgba(124,92,252,0.15);
    background: transparent; color: #6b6890;
    transition: all 0.15s ease; outline: none; white-space: nowrap;
  }
  .nexus-view-btn:hover, .nexus-view-btn.active {
    background: rgba(124,92,252,0.12);
    color: #c4b5fd;
    border-color: rgba(124,92,252,0.35);
  }

  /* Table */
  .nexus-table {
    width: 100%; border-collapse: collapse;
    font-family: 'DM Sans', sans-serif;
  }
  .nexus-table thead tr {
    border-bottom: 1px solid rgba(124,92,252,0.15);
  }
  .nexus-table thead th {
    padding: 12px 16px;
    text-align: left;
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #4b4870;
  }
  .nexus-table tbody tr {
    border-bottom: 1px solid rgba(124,92,252,0.08);
    transition: background 0.12s ease;
  }
  .nexus-table tbody tr:hover { background: rgba(124,92,252,0.05); }
  .nexus-table tbody td {
    padding: 13px 16px;
    font-size: 13px;
  }
  .nexus-table .td-title { color: #eeeaf8; font-weight: 500; }
  .nexus-table .td-meta { color: #7a7499; text-transform: capitalize; }

  /* Status badge */
  .nexus-status-badge {
    display: inline-block;
    padding: 2px 9px; border-radius: 99px;
    font-size: 11px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    text-transform: capitalize;
  }
  .nexus-status-badge.draft {
    background: rgba(124,92,252,0.1); color: #a78bfa;
    border: 1px solid rgba(124,92,252,0.25);
  }
  .nexus-status-badge.planned {
    background: rgba(77,255,210,0.08); color: #4dffd2;
    border: 1px solid rgba(77,255,210,0.2);
  }
  .nexus-status-badge.posted {
    background: rgba(52,211,153,0.1); color: #6ee7b7;
    border: 1px solid rgba(52,211,153,0.2);
  }
`;

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`nexus-status-badge ${status}`}>{status}</span>
  );
}

export function PostList({ posts }: PostListProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // ── ALL LOGIC UNTOUCHED ──
  const filtered = useMemo(() => {
    return posts.filter((post) =>
      `${post.title ?? ""} ${post.caption}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [posts, search]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LIST_STYLES }} />

      <section style={{ display: "flex", flexDirection: "column", gap: 20 }} id="post-list">

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12,
            borderRadius: 14, padding: "18px 20px",
            background: "#0f0f1e",
            border: "1px solid rgba(124,92,252,0.15)",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }} className="nexus-list-search">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
            />
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={`nexus-view-btn${viewMode === "cards" ? " active" : ""}`}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid style={{ width: 14, height: 14 }} />
              Cards
            </button>
            <button
              className={`nexus-view-btn${viewMode === "table" ? " active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <TableIcon style={{ width: 14, height: 14 }} />
              Table
            </button>
          </div>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{
            borderRadius: 14, padding: "32px 20px",
            background: "#0f0f1e",
            border: "1px dashed rgba(124,92,252,0.2)",
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: "#4b4870", fontFamily: "'DM Sans', sans-serif" }}>
              No posts found.
            </p>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards grid — LOGIC UNTOUCHED */
          <div style={{ display: "grid", gap: 20 }} className="sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* Table — LOGIC UNTOUCHED */
          <div style={{
            borderRadius: 14, overflow: "hidden",
            background: "#0f0f1e",
            border: "1px solid rgba(124,92,252,0.15)",
          }}>
            <table className="nexus-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Status</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id}>
                    <td className="td-title">{post.title || "Untitled"}</td>
                    <td><StatusBadge status={post.status} /></td>
                    <td className="td-meta">{post.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}