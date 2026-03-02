"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUserId } from "@/lib/auth";
import { rewriteCaption } from "@/lib/ai/service";
import { createPost, deletePost, setPostStatus, updatePost } from "@/lib/posts";
import { warnPostManagementSupabaseSetup } from "@/lib/supabase-setup";
import { parseCreatePostInput, parseUpdatePostInput } from "@/lib/validators";
import { insertAILog } from "@/supabase/client";

type CreateState = {
  fieldErrors: Partial<
    Record<
      "platform" | "caption" | "status" | "scheduled_date" | "scheduled_time" | "image",
      string
    >
  >;
  formError?: string;
  successMessage?: string;
};

type GenerateState = {
  fieldErrors: Partial<Record<"prompt", string>>;
  formError?: string;
  successMessage?: string;
  generatedCaption?: string;
};

function toActionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected server error while processing post action.";
}

function mapCreateError(error: unknown): CreateState {
  const message = toActionErrorMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes("caption")) {
    return { fieldErrors: { caption: message } };
  }
  if (lower.includes("platform")) {
    return { fieldErrors: { platform: message } };
  }
  if (lower.includes("status")) {
    return { fieldErrors: { status: message } };
  }
  if (lower.includes("scheduled date")) {
    return { fieldErrors: { scheduled_date: message } };
  }
  if (lower.includes("scheduled time")) {
    return { fieldErrors: { scheduled_time: message } };
  }
  if (lower.includes("image")) {
    return { fieldErrors: { image: message } };
  }

  return {
    fieldErrors: {},
    formError: message,
  };
}

export async function createPostAction(formData: FormData): Promise<void> {
  warnPostManagementSupabaseSetup();

  try {
    const input = parseCreatePostInput(formData);
    await createPost(input);
    revalidatePath("/posts");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create post.";
    throw new Error(`Failed to create post: ${message}`);
  }
}

export async function createManagedPostAction(
  _prevState: CreateState,
  formData: FormData,
): Promise<CreateState> {
  warnPostManagementSupabaseSetup();

  try {
    const input = parseCreatePostInput(formData);
    await createPost(input);
  } catch (error) {
    return mapCreateError(error);
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");

  return {
    fieldErrors: {},
    successMessage: "Post saved successfully.",
  };
}

export async function generateCaptionForPostAction(
  _prevState: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const promptRaw = formData.get("prompt");
  const prompt = typeof promptRaw === "string" ? promptRaw.trim() : "";

  if (!prompt) {
    return {
      fieldErrors: {
        prompt: "Prompt is required.",
      },
    };
  }

  if (prompt.length > 1000) {
    return {
      fieldErrors: {
        prompt: "Prompt must be 1000 characters or fewer.",
      },
    };
  }

  try {
    const userId = await requireAuthenticatedUserId();
    const generatedCaption = await rewriteCaption(prompt);

    await insertAILog({
      user_id: userId,
      action: "rewrite_caption",
      input_text: prompt,
      output_text: generatedCaption,
    });

    revalidatePath("/dashboard");

    return {
      fieldErrors: {},
      successMessage: "AI caption generated.",
      generatedCaption,
    };
  } catch (error) {
    return {
      fieldErrors: {},
      formError: toActionErrorMessage(error),
    };
  }
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
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
  redirect(`/posts/${input.id}`);
}

export async function markPostAsPostedAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Invalid post id.");
  }

  try {
    await setPostStatus(id, "posted");
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
}

export async function changePostStatusAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || !id) {
    throw new Error("Invalid post id.");
  }

  if (status !== "draft" && status !== "planned" && status !== "posted") {
    throw new Error("Invalid post status.");
  }

  try {
    await setPostStatus(id, status);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
}
