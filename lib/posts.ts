import { cache } from "react";

import {
  deletePostByIdForUser,
  insertPost,
  resolveImageUrlForDisplay,
  selectPostsByUserId,
  selectPostByIdForUser,
  updatePostByIdForUser,
  uploadPostImage,
} from "@/supabase/client";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types";
import type { Database } from "@/supabase/database.types";
import { requireAuthenticatedUserId } from "@/lib/auth";
import { warnPostManagementSupabaseSetup } from "@/lib/supabase-setup";

// row type directly corresponds to the database's posts row.
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizePostId(id: string): string {
  return id.trim();
}

function isValidPostId(id: string): boolean {
  return uuidPattern.test(id);
}

async function toPost(row: PostRow): Promise<Post> {
  const imageUrl = await resolveImageUrlForDisplay(row.image_url);

  // the generic `row` coming from the supabase client already matches
  // our `Post` type thanks to the updated database.types.ts, however
  // we make a very small normalization step so that optional fields are
  // undefined instead of null which plays more nicely with React.
  return {
    ...row,
    title: row.title ?? undefined,
    caption: row.caption ?? row.body,
    scheduled_date: row.scheduled_date ?? undefined,
    scheduled_time: row.scheduled_time ?? undefined,
    image_url: imageUrl,
  } as Post;
}

export const listPostsForAuthenticatedUser = cache(
  async (): Promise<Post[]> => {
    const userId = await requireAuthenticatedUserId();
    const rows = await selectPostsByUserId(userId);
    return Promise.all(rows.map(toPost));
  },
);

export const listTodayPosts = cache(async (): Promise<Post[]> => {
  const userId = await requireAuthenticatedUserId();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await selectPostsByUserId(userId);
  const filteredRows = rows.filter((row) => row.scheduled_date === today);
  return Promise.all(filteredRows.map(toPost));
});

export const listUpcomingPosts = cache(async (): Promise<Post[]> => {
  const userId = await requireAuthenticatedUserId();
  const start = new Date();
  start.setDate(start.getDate() + 1);

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const rows = await selectPostsByUserId(userId);

  const filteredRows = rows.filter((row) => {
    if (!row.scheduled_date) {
      return false;
    }

    return row.scheduled_date >= startDate && row.scheduled_date <= endDate;
  });

  return Promise.all(filteredRows.map(toPost));
});

export async function getPostById(id: string): Promise<Post | null> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    return null;
  }

  const userId = await requireAuthenticatedUserId();
  const row = await selectPostByIdForUser(postId, userId);
  return row ? toPost(row) : null;
}

export async function createPost(input: CreatePostInput): Promise<void> {
  warnPostManagementSupabaseSetup();

  const userId = await requireAuthenticatedUserId();
  let imageUrl: string | null = null;

  if (input.imageFile) {
    imageUrl = await uploadPostImage(userId, input.imageFile);
  } else if (input.image_url) {
    imageUrl = input.image_url;
  }

  await insertPost({
    user_id: userId,
    platform: input.platform,
    title: input.title || "",
    caption: input.caption,
    body: input.caption,
    image_url: imageUrl,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    published: input.status === "posted",
  });
}

export async function updatePost(input: UpdatePostInput): Promise<void> {
  const postId = normalizePostId(input.id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();
  let imageUrl = input.image_url ?? null;

  if (input.imageFile) {
    imageUrl = await uploadPostImage(userId, input.imageFile);
  }

  await updatePostByIdForUser(postId, userId, {
    platform: input.platform,
    title: input.title,
    caption: input.caption,
    body: input.caption,
    image_url: imageUrl,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    published: input.published,
    updated_at: new Date().toISOString(),
  });
}

export async function setPostStatus(
  id: string,
  status: Post["status"],
): Promise<void> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();

  await updatePostByIdForUser(postId, userId, {
    status,
    published: status === "posted",
    updated_at: new Date().toISOString(),
  });
}

export async function deletePost(id: string): Promise<void> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();
  const existingPost = await selectPostByIdForUser(postId, userId);

  if (!existingPost) {
    throw new Error("Post not found or access denied.");
  }

  await deletePostByIdForUser(postId, userId);
}
