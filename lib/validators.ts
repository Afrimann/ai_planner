import type { CreatePostInput, UpdatePostInput } from "@/types";

function readString(formData: FormData, key: string): string {
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

function readImageFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (value == null) {
    return null;
  }

  if (!(value instanceof File)) {
    throw new Error("Invalid image upload.");
  }

  if (value.size === 0) {
    return null;
  }

  if (!value.type.startsWith("image/")) {
    throw new Error("Uploaded file must be an image.");
  }

  return value;
}

export function parseCreatePostInput(formData: FormData): CreatePostInput {
  const title = readString(formData, "title");
  const body = readString(formData, "body");
  const userId = readString(formData, "user_id");
  const imageFile = readImageFile(formData, "image");

  if (title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error("user_id can only contain letters, numbers, underscores, and hyphens.");
  }

  return { title, body, userId, imageFile };
}

export function parseUpdatePostInput(formData: FormData): UpdatePostInput {
  const id = readString(formData, "id");
  const title = readString(formData, "title");
  const body = readString(formData, "body");
  const published = formData.get("published") === "on";

  if (title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  return { id, title, body, published };
}

export function parsePrompt(formData: FormData): string {
  const prompt = readString(formData, "prompt");

  if (prompt.length > 1000) {
    throw new Error("Prompt must be 1000 characters or fewer.");
  }

  return prompt;
}
