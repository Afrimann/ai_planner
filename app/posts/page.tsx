import Link from "next/link";

import { createPostAction, deletePostAction } from "@/app/posts/actions";
import { listPosts } from "@/lib/posts";
import { formatDateTime } from "@/lib/date";

export default async function PostsPage() {
  const posts = await listPosts();

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Posts</h1>
        <p className="text-slate-600">Create and manage planning updates using server actions.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create post</h2>
        <form action={createPostAction} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              type="text"
              name="title"
              required
              maxLength={120}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Body</span>
            <textarea name="body" required rows={4} className="rounded-md border border-slate-300 px-3 py-2" />
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
                  {post.title}
                </Link>
                <p className="text-sm text-slate-500">
                  Updated {formatDateTime(post.updated_at)} · {post.published ? "Published" : "Draft"}
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
          </article>
        ))}
      </section>
    </section>
  );
}
