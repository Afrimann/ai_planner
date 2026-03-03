import Link from "next/link";
import { ChevronRight, FileText, Plus, Sparkles } from "lucide-react";

import { PostForm } from "@/components/posts/PostForm";
import { PostList } from "@/components/posts/PostList";
import { Button } from "@/components/ui/Button";
import { listPostsForAuthenticatedUser } from "@/lib/posts";
// import { warnPostManagementSupabaseSetup } from "@/lib/supabase-setup";

export default async function PostsPage() {
  const posts = await listPostsForAuthenticatedUser();
  const upcomingCount = posts.filter((post) => {
    if (!post.scheduled_date) {
      return false;
    }
    return post.scheduled_date >= new Date().toISOString().slice(0, 10);
  }).length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <section className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-zinc-500"
      >
        <Link href="/dashboard" className="hover:text-black">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-black">Posts</span>
      </nav>

      <header className="rounded-2xl border border-zinc-300 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              Post Management
            </h1>
            <p className="text-sm text-zinc-600">
              Create, schedule, publish, and organize all posts in a single
              workflow.
            </p>
          </div>

          <div className="flex  gap-2">
            <a href="#post-form">
              <Button className="flex gap-2">
                <div className="flex gap-2 items-center">
                  <Plus className="h-4 w-4" />
                  New Post
                </div>
              </Button>
            </a>
            <a href="#post-list">
              <Button variant="secondary" className="">
                <div className="flex gap-2 items-center">
                  <FileText className="h-4 w-4" />
                  View List
                </div>
              </Button>
            </a>
            <a href="#post-form">
              <Button variant="secondary">
                <div className="flex gap-2 items-center">
                  <Sparkles className="h-4 w-4" />
                  AI Tools
                </div>
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Posts"
            value={posts.length}
            helper="All statuses"
          />
          <StatCard
            label="Upcoming"
            value={upcomingCount}
            helper="Scheduled ahead"
          />
          <StatCard label="Drafts" value={draftCount} helper="Pending review" />
        </div>
      </header>

      <div className="grid gap-6 2xl:grid-cols-[430px_1fr]">
        <PostForm />
        <PostList posts={posts} />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-300 bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-black">{value}</p>
      <p className="text-xs text-zinc-500">{helper}</p>
    </article>
  );
}
