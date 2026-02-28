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
        <p className="text-slate-600">Update content and publish status.</p>
      </header>
      {post.image_url ? (
        <img src={post.image_url} alt={`${post.title} image`} className="max-h-80 rounded-md border border-slate-200" />
      ) : null}
      <form action={updatePostAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={post.id} />
        <label className="grid gap-1">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            name="title"
            defaultValue={post.title}
            required
            maxLength={120}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Body</span>
          <textarea
            name="body"
            rows={10}
            defaultValue={post.body}
            required
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={post.published} className="size-4" />
          <span className="text-sm">Published</span>
        </label>
        <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white">
          Update post
        </button>
      </form>
    </section>
  );
}
