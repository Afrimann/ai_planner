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

export function parseCreatePostInput(formData: FormData): CreatePostInput {
  const title = readString(formData, "title");
  const body = readString(formData, "body");

  if (title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  return { title, body };
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
