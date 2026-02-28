"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPost, deletePost, updatePost } from "@/lib/posts";
import { parseCreatePostInput, parseUpdatePostInput } from "@/lib/validators";

export async function createPostAction(formData: FormData): Promise<void> {
  try {
    const input = parseCreatePostInput(formData);
    await createPost(input);
    revalidatePath("/posts");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post.";
    throw new Error(`Failed to create post: ${message}`);
  }
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Invalid post id.");
  }

  await deletePost(id);
  revalidatePath("/posts");
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const input = parseUpdatePostInput(formData);
  await updatePost(input);
  revalidatePath("/posts");
  revalidatePath(`/posts/${input.id}`);
  redirect(`/posts/${input.id}`);
}
