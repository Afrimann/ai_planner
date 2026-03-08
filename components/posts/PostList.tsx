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
  .nexus-list-search label,
  .nexus-list-search [data-slot="label"],
  .nexus-list-search [class*="label"],
  .nexus-list-search [class*="Label"] {
    color: hsl(var(--muted-foreground)) !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
  }

  .nexus-list-search input {
    background: hsl(var(--card)) !important;
    color: hsl(var(--foreground)) !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 12px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 13.5px !important;
    outline: none !important;
    transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  }

  .nexus-list-search input:focus {
    border-color: hsl(var(--foreground) / 0.5) !important;
    box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.08) !important;
  }

  .nexus-list-search input::placeholder {
    color: hsl(var(--muted-foreground)) !important;
    -webkit-text-fill-color: hsl(var(--muted-foreground)) !important;
    opacity: 1 !important;
  }

  .nexus-view-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card));
    color: hsl(var(--muted-foreground));
    transition: all 0.15s ease;
    outline: none;
    white-space: nowrap;
  }

  .nexus-view-btn:hover,
  .nexus-view-btn.active {
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    border-color: hsl(var(--foreground));
  }

  .nexus-table-wrap {
    border-radius: 14px;
    overflow: hidden;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
  }

  .nexus-table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nexus-table {
    width: 100%;
    min-width: 580px;
    border-collapse: collapse;
    font-family: 'Poppins', sans-serif;
  }

  .nexus-table thead tr {
    border-bottom: 1px solid hsl(var(--border));
  }

  .nexus-table thead th {
    padding: 12px 16px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: hsl(var(--muted-foreground));
    white-space: nowrap;
  }

  .nexus-table tbody tr {
    border-bottom: 1px solid hsl(var(--border));
    transition: background 0.12s ease;
  }

  .nexus-table tbody tr:last-child {
    border-bottom: 0;
  }

  .nexus-table tbody tr:hover {
    background: hsl(var(--muted) / 0.65);
  }

  .nexus-table tbody td {
    padding: 13px 16px;
    font-size: 13px;
  }

  .nexus-table .td-title {
    color: hsl(var(--foreground));
    font-weight: 500;
  }

  .nexus-table .td-meta {
    color: hsl(var(--muted-foreground));
    text-transform: capitalize;
  }

  .nexus-status-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    text-transform: capitalize;
    border: 1px solid hsl(var(--border));
    white-space: nowrap;
  }

  .nexus-status-badge.draft {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
  }

  .nexus-status-badge.planned {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border-color: hsl(var(--foreground) / 0.3);
  }

  .nexus-status-badge.posted {
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    border-color: hsl(var(--foreground));
  }

  @media (max-width: 640px) {
    .nexus-table {
      min-width: 520px;
    }

    .nexus-table thead th,
    .nexus-table tbody td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }
`;

function StatusBadge({ status }: { status: string }) {
  return <span className={`nexus-status-badge ${status}`}>{status}</span>;
}

export function PostList({ posts }: PostListProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const filtered = useMemo(() => {
    return posts.filter((post) =>
      `${post.title ?? ""} ${post.caption}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [posts, search]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LIST_STYLES }} />

      <section
        className="flex flex-col gap-4 sm:gap-5"
        id="post-list"
      >
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-5"
        >
          <div className="nexus-list-search min-w-0 flex-1 sm:min-w-[260px]">
            <Input
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search posts..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              className={`nexus-view-btn${viewMode === "cards" ? " active" : ""}`}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid style={{ width: 14, height: 14 }} />
              Cards
            </button>
            <button
              type="button"
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
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center sm:px-5">
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "hsl(var(--muted-foreground))",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              No posts found.
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="nexus-table-wrap">
            <div className="nexus-table-scroll">
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
                      <td>
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="td-meta">{post.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
