import { cache } from "react";

import {
  deletePostByIdForUser,
  insertPost,
  requireAuthenticatedUserId,
  selectPostByIdForUser,
  selectPostsByUserId,
  updatePostByIdForUser,
} from "@/supabase/client";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types";

function toPost(row: Awaited<ReturnType<typeof selectPostsByUserId>>[number]): Post {
  return {
    ...row,
    title: row.title ?? undefined,
    image_url: row.image_url ?? undefined,
    scheduled_date: row.scheduled_date ?? undefined,
    scheduled_time: row.scheduled_time ?? undefined,
  };
}

export const listPostsForAuthenticatedUser = cache(async (): Promise<Post[]> => {
  const userId = await requireAuthenticatedUserId();
  const rows = await selectPostsByUserId(userId);
  return rows.map(toPost);
});

export async function getPostById(id: string): Promise<Post | null> {
  const userId = await requireAuthenticatedUserId();
  const row = await selectPostByIdForUser(id, userId);
  return row ? toPost(row) : null;
}

export async function createPost(input: CreatePostInput): Promise<void> {
  const userId = await requireAuthenticatedUserId();

  await insertPost({
    user_id: userId,
    platform: input.platform,
    title: input.title ?? null,
    caption: input.caption,
    image_url: input.image_url ?? null,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
  });
}

export async function updatePost(input: UpdatePostInput): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  const existingPost = await selectPostByIdForUser(input.id, userId);

  if (!existingPost) {
    throw new Error("Post not found or access denied.");
  }

  await updatePostByIdForUser(input.id, userId, {
    platform: input.platform,
    title: input.title ?? null,
    caption: input.caption,
    image_url: input.image_url ?? null,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function deletePost(id: string): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  const existingPost = await selectPostByIdForUser(id, userId);

  if (!existingPost) {
    throw new Error("Post not found or access denied.");
  }

  await deletePostByIdForUser(id, userId);
}
