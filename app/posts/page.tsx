import Link from "next/link";

import { createPostAction, deletePostAction } from "@/app/posts/actions";
import { formatDateTime } from "@/lib/date";
import { listPostsForAuthenticatedUser } from "@/lib/posts";

export default async function PostsPage() {
  const posts = await listPostsForAuthenticatedUser();

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Posts</h1>
        <p className="text-slate-600">Create and manage social posts with authenticated server actions.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create post</h2>
        <form action={createPostAction} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Platform</span>
            <select name="platform" required className="rounded-md border border-slate-300 px-3 py-2">
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title (optional)</span>
            <input type="text" name="title" maxLength={120} className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Caption</span>
            <textarea name="caption" required rows={4} className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Image URL (optional)</span>
            <input type="url" name="image_url" className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Status</span>
            <select name="status" required className="rounded-md border border-slate-300 px-3 py-2">
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="posted">Posted</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Scheduled date (optional)</span>
              <input type="date" name="scheduled_date" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Scheduled time (optional)</span>
              <input type="time" name="scheduled_time" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white">
            Save post
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/posts/${post.id}`} className="text-lg font-semibold hover:underline">
                  {post.title || "Untitled post"}
                </Link>
                <p className="text-sm text-slate-500">
                  {post.platform} · {post.status} · Updated {formatDateTime(post.updated_at)}
                </p>
              </div>
              <form action={deletePostAction}>
                <input type="hidden" name="id" value={post.id} />
                <button type="submit" className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">
                  Delete
                </button>
              </form>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-slate-700">{post.caption}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
