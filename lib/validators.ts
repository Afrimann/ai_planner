import type { CreatePostInput, PostPlatform, PostStatus, UpdatePostInput } from "@/types";

const allowedPlatforms: readonly PostPlatform[] = ["instagram", "linkedin", "twitter"];
const allowedStatuses: readonly PostStatus[] = ["draft", "planned", "posted"];

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`Missing field: ${key}`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Field cannot be empty: ${key}`);
  }

  return normalized;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function parsePlatform(value: string): PostPlatform {
  if (allowedPlatforms.includes(value as PostPlatform)) {
    return value as PostPlatform;
  }

  throw new Error("Invalid platform.");
}

function parseStatus(value: string): PostStatus {
  if (allowedStatuses.includes(value as PostStatus)) {
    return value as PostStatus;
  }

  throw new Error("Invalid status.");
}

function buildPostInput(formData: FormData): Omit<CreatePostInput, never> {
  const platform = parsePlatform(readRequiredString(formData, "platform"));
  const caption = readRequiredString(formData, "caption");
  const status = parseStatus(readRequiredString(formData, "status"));
  const title = readOptionalString(formData, "title");
  const image_url = readOptionalString(formData, "image_url");
  const scheduled_date = readOptionalString(formData, "scheduled_date");
  const scheduled_time = readOptionalString(formData, "scheduled_time");

  if (caption.length > 2000) {
    throw new Error("Caption must be 2000 characters or fewer.");
  }

  if (title && title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  return {
    platform,
    title,
    caption,
    image_url,
    status,
    scheduled_date,
    scheduled_time,
  };
}

export function parseCreatePostInput(formData: FormData): CreatePostInput {
  return buildPostInput(formData);
}

export function parseUpdatePostInput(formData: FormData): UpdatePostInput {
  const id = readRequiredString(formData, "id");
  const input = buildPostInput(formData);

  return {
    id,
    ...input,
  };
}

export function parsePrompt(formData: FormData): string {
  const prompt = readRequiredString(formData, "prompt");

  if (prompt.length > 1000) {
    throw new Error("Prompt must be 1000 characters or fewer.");
  }

  return prompt;
}
