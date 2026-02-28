"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPost, deletePost, updatePost } from "@/lib/posts";
import { parseCreatePostInput, parseUpdatePostInput } from "@/lib/validators";

function toActionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected server error while processing post action.";
}

export async function createPostAction(formData: FormData): Promise<void> {
  try {
    const input = parseCreatePostInput(formData);
    await createPost(input);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath("/posts");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Invalid post id.");
  }

  try {
    await deletePost(id);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath("/posts");
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const input = parseUpdatePostInput(formData);

  try {
    await updatePost(input);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${input.id}`);
  redirect(`/posts/${input.id}`);
}
