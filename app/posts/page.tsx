import Link from "next/link";

import { createPostAction, deletePostAction } from "@/app/posts/actions";
import { formatDateTime } from "@/lib/date";
import { listPosts } from "@/lib/posts";

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
        <form action={createPostAction} encType="multipart/form-data" className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">User ID</span>
            <input type="text" name="user_id" required className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
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
            <span className="text-sm font-medium">Image</span>
            <input type="file" name="image" accept="image/*" className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
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
            <p className="mt-3 whitespace-pre-wrap text-slate-700">{post.body}</p>
            {post.image_url ? (
              <img src={post.image_url} alt={`${post.title} image`} className="mt-3 max-h-72 rounded-md border border-slate-200" />
            ) : null}
          </article>
        ))}
      </section>
    </section>
  );
}
