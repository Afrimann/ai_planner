import { cache } from "react";

import {
  deletePostById,
  insertPost,
  selectPostById,
  selectPosts,
  updatePostById,
} from "@/supabase/client";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types";

export const listPosts = cache(async (): Promise<Post[]> => {
  return selectPosts();
});

export async function getPostById(id: string): Promise<Post | null> {
  return selectPostById(id);
}

export async function createPost(input: CreatePostInput): Promise<void> {
  await insertPost({
    title: input.title,
    body: input.body,
    published: false,
  });
}

export async function updatePost(input: UpdatePostInput): Promise<void> {
  await updatePostById(input.id, {
    title: input.title,
    body: input.body,
    published: input.published,
    updated_at: new Date().toISOString(),
  });
}

export async function deletePost(id: string): Promise<void> {
  await deletePostById(id);
}
