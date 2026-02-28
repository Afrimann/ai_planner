import { notFound } from "next/navigation";

import { updatePostAction } from "@/app/posts/actions";
import { getPostById } from "@/lib/posts";

interface PostPageProps {
  params: {
    id: string;
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Edit post</h1>
        <p className="text-slate-600">Update caption, schedule, and publish status.</p>
      </header>
      {post.image_url ? (
        <img src={post.image_url} alt={`${post.title} image`} className="max-h-80 rounded-md border border-slate-200" />
      ) : null}
      <form action={updatePostAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={post.id} />
        <label className="grid gap-1">
          <span className="text-sm font-medium">Platform</span>
          <select name="platform" defaultValue={post.platform} required className="rounded-md border border-slate-300 px-3 py-2">
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Title (optional)</span>
          <input
            type="text"
            name="title"
            defaultValue={post.title}
            maxLength={120}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Caption</span>
          <textarea
            name="caption"
            rows={10}
            defaultValue={post.caption}
            required
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Image URL (optional)</span>
          <input
            type="url"
            name="image_url"
            defaultValue={post.image_url}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Status</span>
          <select name="status" defaultValue={post.status} required className="rounded-md border border-slate-300 px-3 py-2">
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="posted">Posted</option>
          </select>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Scheduled date (optional)</span>
            <input
              type="date"
              name="scheduled_date"
              defaultValue={post.scheduled_date}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Scheduled time (optional)</span>
            <input
              type="time"
              name="scheduled_time"
              defaultValue={post.scheduled_time}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white">
          Update post
        </button>
      </form>
    </section>
  );
}
