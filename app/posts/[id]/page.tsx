import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { updatePostAction } from "@/app/posts/actions";
import { PostForm } from "@/components/posts/PostForm";
import { getPostById } from "@/lib/posts";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard" className="hover:text-black">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/posts" className="hover:text-black">
          Posts
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-black">Edit</span>
      </nav>

      <header className="rounded-2xl border border-zinc-300 bg-white p-5">
        <h1 className="text-3xl font-semibold text-black">Edit Post</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Update caption, media, and schedule with the same validation rules as create.
        </p>
      </header>

      <PostForm mode="edit" initialPost={post} editAction={updatePostAction} />
    </section>
  );
}
