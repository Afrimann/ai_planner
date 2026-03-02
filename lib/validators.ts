import type {
  CreatePostInput,
  PostPlatform,
  PostStatus,
  UpdatePostInput,
} from "@/types";

const allowedPlatforms: readonly PostPlatform[] = [
  "instagram",
  "linkedin",
  "twitter",
];
const allowedStatuses: readonly PostStatus[] = ["draft", "planned", "posted"];

const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

  if (!allowedImageMimeTypes.has(value.type)) {
    throw new Error("Uploaded file must be JPEG, PNG, WEBP, or GIF.");
  }

  if (value.size > maxImageSizeBytes) {
    throw new Error("Uploaded image must be 5MB or smaller.");
  }

  return value;
}

function readOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formData.get(key);
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value);
}

function normalizeTime(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(
    /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
  );

  if (!match) {
    return value;
  }

  return `${match[1]}:${match[2]}`;
}

function validateScheduling(
  status: PostStatus,
  scheduled_date?: string,
  scheduled_time?: string,
): void {
  if (scheduled_time && !scheduled_date) {
    throw new Error("Scheduled date is required when time is provided.");
  }

  if (scheduled_date && !isValidDate(scheduled_date)) {
    throw new Error("Scheduled date must use YYYY-MM-DD format.");
  }

  if (scheduled_time && !isValidTime(scheduled_time)) {
    throw new Error("Scheduled time must use HH:MM 24-hour format.");
  }

  if (status === "planned" && !scheduled_date) {
    throw new Error("Planned posts require a scheduled date.");
  }

  if (status === "planned" && scheduled_date) {
    const scheduled = new Date(`${scheduled_date}T${scheduled_time ?? "00:00"}:00`);
    const now = new Date();
    if (scheduled.getTime() < now.getTime() - 60 * 1000) {
      throw new Error("Scheduled datetime cannot be in the past for planned posts.");
    }
  }
}

export function parseCreatePostInput(formData: FormData): CreatePostInput {
  const platform = parsePlatform(readRequiredString(formData, "platform"));
  const caption = readRequiredString(formData, "caption");
  const status = parseStatus(readRequiredString(formData, "status"));
  const title = readOptionalString(formData, "title");
  const image_url = readOptionalString(formData, "image_url");
  const scheduled_date = readOptionalString(formData, "scheduled_date");
  const scheduled_time = normalizeTime(
    readOptionalString(formData, "scheduled_time"),
  );
  const imageFile = readImageFile(formData, "image");

  if (caption.length > 2000) {
    throw new Error("Caption must be 2000 characters or fewer.");
  }

  if (title && title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  validateScheduling(status, scheduled_date, scheduled_time);

  return {
    platform,
    caption,
    status,
    title,
    image_url,
    imageFile,
    scheduled_date,
    scheduled_time,
  };
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

export function parseUpdatePostInput(formData: FormData): UpdatePostInput {
  const id = readRequiredString(formData, "id");
  const base = parseCreatePostInput(formData);

  return {
    id,
    ...base,
    // published is not part of the create form but we allow callers to
    // override it by including a hidden field if necessary.
    published: formData.get("published") === "true" ? true : undefined,
  };
}

export function parsePrompt(formData: FormData): string {
  const prompt = readRequiredString(formData, "prompt");

  if (prompt.length > 1000) {
    throw new Error("Prompt must be 1000 characters or fewer.");
  }

  return prompt;
}
