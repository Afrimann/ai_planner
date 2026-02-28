import { cache } from "react";

import {
  deletePostByIdForUser,
  insertPost,
  selectPostById,
  selectPosts,
  selectPostsByScheduledDateRange,
  updatePostById,
  uploadPostImage,
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

export const listTodayPosts = cache(async (): Promise<Post[]> => {
  const today = new Date().toISOString().slice(0, 10);
  return selectPostsByScheduledDateRange(today, today);
});

export const listUpcomingPosts = cache(async (): Promise<Post[]> => {
  const start = new Date();
  start.setDate(start.getDate() + 1);

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  return selectPostsByScheduledDateRange(startDate, endDate);
});

export async function getPostById(id: string): Promise<Post | null> {
  const userId = await requireAuthenticatedUserId();
  const row = await selectPostByIdForUser(id, userId);
  return row ? toPost(row) : null;
}

export async function createPost(input: CreatePostInput): Promise<void> {
  let imageUrl: string | null = null;

  if (input.imageFile) {
    imageUrl = await uploadPostImage(input.userId, input.imageFile);
  }

  await insertPost({
    title: input.title,
    body: input.body,
    image_url: imageUrl,
    published: false,
  });
}

export async function updatePost(input: UpdatePostInput): Promise<void> {
  await updatePostById(input.id, {
    title: input.title,
    body: input.body,
    caption: input.body,
    published: input.published,
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
