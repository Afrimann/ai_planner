"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUserId } from "@/lib/auth";
import { createPost, setPostStatus } from "@/lib/posts";
import { rewriteCaption } from "@/lib/ai/service";
import { insertAILog } from "@/supabase/client";
import type { PostPlatform, PostStatus } from "@/types";

const allowedPlatforms: readonly PostPlatform[] = [
  "instagram",
  "linkedin",
  "twitter",
];
const allowedStatuses: readonly PostStatus[] = ["draft", "planned", "posted"];

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function parsePlatform(value: string): PostPlatform | null {
  if (allowedPlatforms.includes(value as PostPlatform)) {
    return value as PostPlatform;
  }
  return null;
}

function parseStatus(value: string): PostStatus | null {
  if (allowedStatuses.includes(value as PostStatus)) {
    return value as PostStatus;
  }
  return null;
}

function readImageFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!(value instanceof File)) {
    return null;
  }

  if (value.size === 0) {
    return null;
  }

  if (!value.type.startsWith("image/")) {
    throw new Error("Uploaded file must be an image.");
  }

  return value;
}

export async function createDashboardPostAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{
  fieldErrors: Partial<Record<"platform" | "caption" | "status", string>>;
  formError?: string;
  successMessage?: string;
}> {
  const platform = parsePlatform(readString(formData, "platform"));
  const caption = readString(formData, "caption");
  const status = parseStatus(readString(formData, "status"));
  const title = readOptionalString(formData, "title");
  const imageUrl = readOptionalString(formData, "image_url");
  const scheduledDate = readOptionalString(formData, "scheduled_date");
  const scheduledTime = readOptionalString(formData, "scheduled_time");

  const fieldErrors: Partial<
    Record<"platform" | "caption" | "status", string>
  > = {};

  if (!platform) {
    fieldErrors.platform = "Select a valid platform.";
  }
  if (!caption) {
    fieldErrors.caption = "Caption is required.";
  } else if (caption.length > 2000) {
    fieldErrors.caption = "Caption must be 2000 characters or fewer.";
  }
  if (!status) {
    fieldErrors.status = "Select a valid status.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const normalizedPlatform = platform as PostPlatform;
  const normalizedStatus = status as PostStatus;

  try {
    const imageFile = readImageFile(formData, "image");
    await createPost({
      platform: normalizedPlatform,
      title,
      caption,
      image_url: imageUrl,
      imageFile,
      status: normalizedStatus,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create post right now.";

    return {
      fieldErrors: {},
      formError: message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/posts");
  revalidatePath("/calendar");

  return {
    fieldErrors: {},
    successMessage: "Post created successfully.",
  };
}

export async function generateCaptionAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{
  fieldErrors: Partial<Record<"prompt", string>>;
  formError?: string;
  successMessage?: string;
  generatedCaption?: string;
}> {
  const prompt = readString(formData, "prompt");
  const fieldErrors: Partial<Record<"prompt", string>> = {};

  if (!prompt) {
    fieldErrors.prompt = "Enter a prompt to generate a caption.";
  } else if (prompt.length > 1000) {
    fieldErrors.prompt = "Prompt must be 1000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
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
    const message =
      error instanceof Error ? error.message : "Failed to generate caption.";
    return {
      fieldErrors: {},
      formError: message,
    };
  }
}

export async function updatePostStatusAction(formData: FormData): Promise<void> {
  const id = readString(formData, "id");
  const status = parseStatus(readString(formData, "status"));

  if (!id || !status) {
    throw new Error("Invalid status update payload.");
  }

  await setPostStatus(id, status);
  revalidatePath("/dashboard");
  revalidatePath("/posts");
}
