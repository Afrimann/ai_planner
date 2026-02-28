import { cache } from "react";

import {
  deletePostById,
  insertPost,
  selectPostById,
  selectPosts,
  selectPostsByScheduledDateRange,
  updatePostById,
} from "@/supabase/client";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types";

export const listPosts = cache(async (): Promise<Post[]> => {
  return selectPosts();
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
  return selectPostById(id);
}

export async function createPost(input: CreatePostInput): Promise<void> {
  await insertPost({
    title: input.title,
    body: input.body,
    caption: input.body,
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
  await deletePostById(id);
}
