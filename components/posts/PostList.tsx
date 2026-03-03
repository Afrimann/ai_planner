"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, LayoutGrid, Table as TableIcon } from "lucide-react";

import { PostCard } from "@/components/posts/PostCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Post } from "@/types";

interface PostListProps {
  posts: Post[];
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
    <section className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-black/40 bg-white/5 backdrop-blur-sm p-5"
      >
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="min-w-[250px] flex-1 bg-transparent border-black/40"
        />

        <Button variant="ghost" onClick={() => setViewMode("cards")}>
          <div className="flex gap-2 items-center">
            <LayoutGrid className="h-4 w-4" />
            Cards
          </div>
        </Button>

        <Button variant="ghost" onClick={() => setViewMode("table")}>
          <div className="flex gap-2 items-center">
            <TableIcon className="h-4 w-4" />
            Table
          </div>
        </Button>
      </motion.div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-black/40 bg-white/5 p-6 text-sm text-gray-400">
          No posts found.
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-black/40 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-black/40 text-left text-gray-400">
              <tr>
                <th className="p-4">Post</th>
                <th>Status</th>
                <th>Platform</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-black/30 hover:bg-white/5"
                >
                  <td className="p-4 text-white">{post.title || "Untitled"}</td>
                  <td className="capitalize text-gray-300">{post.status}</td>
                  <td className="capitalize text-gray-300">{post.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
