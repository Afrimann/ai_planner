import { randomUUID } from "crypto";
import { extname } from "path";

import type { Database } from "@/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
type AILogRow = Database["public"]["Tables"]["ai_logs"]["Row"];
type AILogInsert = Database["public"]["Tables"]["ai_logs"]["Insert"];

interface SupabaseAuthUser {
  id: string;
}

interface SupabaseErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

interface SupabaseSignedUrlResponse {
  signedURL?: string;
  signedUrl?: string;
}

function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Manual setup required in Supabase dashboard:
  // ensure this bucket exists and has correct storage policies.
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "post-images";

  if (!rawUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const url = rawUrl.replace(/\/+$/, "");

  return { url, serviceRoleKey, storageBucket };
}

function parseErrorMessage(
  body: SupabaseErrorResponse | null,
  status: number,
): string {
  const rawMessage = body?.error?.message ?? body?.message ?? "";

  if (rawMessage.includes("Could not find the table 'public.posts'")) {
    return "Supabase table public.posts is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  if (rawMessage.includes("Could not find the table 'public.ai_logs'")) {
    return "Supabase table public.ai_logs is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  return (
    rawMessage ||
    `Supabase request failed (${status}).`
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as SupabaseErrorResponse | null;
    throw new Error(parseErrorMessage(body, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function encodeStorageObjectPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractObjectPathFromStorageUrl(
  imageUrl: string,
  supabaseUrl: string,
  storageBucket: string,
): string | null {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return null;
  }

  const prefixes = [
    `/storage/v1/object/public/${storageBucket}/`,
    `/storage/v1/object/${storageBucket}/`,
    `/object/public/${storageBucket}/`,
    `/object/${storageBucket}/`,
    `${storageBucket}/`,
  ];

  const fromPathname = (pathname: string): string | null => {
    for (const prefix of prefixes) {
      if (pathname.startsWith(prefix)) {
        return pathname.slice(prefix.length);
      }
    }

    return null;
  };

  try {
    const parsed = new URL(trimmed);
    const supabase = new URL(supabaseUrl);

    if (parsed.origin !== supabase.origin) {
      return null;
    }

    const fromAbsolute = fromPathname(parsed.pathname);
    return fromAbsolute ? safeDecode(fromAbsolute) : null;
  } catch {
    const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const fromRelative = fromPathname(normalized);
    if (fromRelative) {
      return safeDecode(fromRelative);
    }

    const plain = trimmed.replace(/^\/+/, "");
    if (/^[0-9a-f-]{36}\/.+/i.test(plain)) {
      return plain;
    }

    return null;
  }
}

function toAbsoluteStorageSignedUrl(baseUrl: string, signedUrl: string): string {
  if (/^https?:\/\//i.test(signedUrl)) {
    return signedUrl;
  }

  if (signedUrl.startsWith("/storage/v1/")) {
    return `${baseUrl}${signedUrl}`;
  }

  if (signedUrl.startsWith("/object/")) {
    return `${baseUrl}/storage/v1${signedUrl}`;
  }

  if (signedUrl.startsWith("object/")) {
    return `${baseUrl}/storage/v1/${signedUrl}`;
  }

  if (signedUrl.startsWith("/")) {
    return `${baseUrl}${signedUrl}`;
  }

  return `${baseUrl}/${signedUrl}`;
}

function buildPublicStorageUrl(
  supabaseUrl: string,
  storageBucket: string,
  objectPath: string,
): string {
  const encodedObjectPath = encodeStorageObjectPath(objectPath);
  return `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${encodedObjectPath}`;
}

async function createSignedStorageUrl(objectPath: string): Promise<string> {
  const { url, serviceRoleKey, storageBucket } = getSupabaseEnv();
  const encodedObjectPath = encodeStorageObjectPath(objectPath);

  const response = await fetch(
    `${url}/storage/v1/object/sign/${storageBucket}/${encodedObjectPath}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        // 7 days: long enough for dashboard/edit views without forcing
        // frequent URL refreshes.
        expiresIn: 7 * 24 * 60 * 60,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create signed image URL (${response.status}).`);
  }

  const body = (await response
    .json()
    .catch(() => null)) as SupabaseSignedUrlResponse | null;
  const signedUrl = body?.signedUrl ?? body?.signedURL;

  if (!signedUrl) {
    throw new Error("Signed image URL response is missing signed URL.");
  }

  return toAbsoluteStorageSignedUrl(url, signedUrl);
}

export async function resolveImageUrlForDisplay(
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }

  const normalized = imageUrl.trim();
  if (!normalized) {
    return null;
  }

  const { url, storageBucket } = getSupabaseEnv();
  const objectPath = extractObjectPathFromStorageUrl(
    normalized,
    url,
    storageBucket,
  );

  if (!objectPath) {
    return normalized;
  }

  try {
    return await createSignedStorageUrl(objectPath);
  } catch {
    // If signing fails (e.g. storage config mismatch), still attempt a
    // best-effort public URL so rendering can succeed in public buckets.
    return buildPublicStorageUrl(url, storageBucket, objectPath);
  }
}

// list of columns we request when querying the posts table. keep this in
// sync with the schema and the `Post` type in our application.
const postColumns =
  "id,user_id,platform,title,caption,body,image_url,status,scheduled_date,scheduled_time,created_at,updated_at,published";

export async function selectPosts(): Promise<PostRow[]> {
  const query = `posts?select=${postColumns}&order=created_at.desc`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostById(id: string): Promise<PostRow | null> {
  const query = `posts?select=${postColumns}&id=eq.${id}&limit=1`;
  const rows = await request<PostRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function uploadPostImage(
  userId: string,
  file: File,
): Promise<string> {
  const { url, serviceRoleKey, storageBucket } = getSupabaseEnv();
  const fileExt = extname(file.name) || ".bin";
  const objectPath = `${userId}/${randomUUID()}${fileExt}`;

  const response = await fetch(
    `${url}/storage/v1/object/${storageBucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: Buffer.from(await file.arrayBuffer()),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as SupabaseErrorResponse | null;
    const message =
      body?.error?.message ?? "Failed to upload image to storage.";

    if (
      message.toLowerCase().includes("bucket") ||
      message.toLowerCase().includes("policy") ||
      message.toLowerCase().includes("permission")
    ) {
      throw new Error(
        "Storage upload failed. Check Supabase bucket `post-images` exists and storage RLS policies allow authenticated uploads.",
      );
    }

    throw new Error(message);
  }

  const publicUrl = buildPublicStorageUrl(url, storageBucket, objectPath);
  return publicUrl;
}

export async function insertPost(post: PostInsert): Promise<void> {
  await request<PostRow[]>("posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function updatePostByIdForUser(
  id: string,
  userId: string,
  update: PostUpdate,
): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<PostRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

// helper queries that the higher-level `lib/posts.ts` module uses.  they
// encode the additional filters that are required by the application
// (user ownership, date ranges, etc.).

export async function selectPostsByUserId(userId: string): Promise<PostRow[]> {
  const query = `posts?select=${postColumns}&user_id=eq.${userId}&order=created_at.desc`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostByIdForUser(
  id: string,
  userId: string,
): Promise<PostRow | null> {
  const query = `posts?select=${postColumns}&id=eq.${id}&user_id=eq.${userId}&limit=1`;
  const rows = await request<PostRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function selectPostsByScheduledDateRange(
  start: string,
  end: string,
): Promise<PostRow[]> {
  const query = `posts?select=${postColumns}&scheduled_date=gte.${start}&scheduled_date=lte.${end}&order=scheduled_date.asc`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function updatePostById(
  id: string,
  update: PostUpdate,
): Promise<void> {
  const query = `posts?id=eq.${id}`;
  await request<PostRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export async function deletePostByIdForUser(
  id: string,
  userId: string,
): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<void>(query, {
    method: "DELETE",
  });
}

export async function insertAILog(log: AILogInsert): Promise<void> {
  await request<AILogInsert[]>("ai_logs", {
    method: "POST",
    body: JSON.stringify(log),
  });
}

export async function selectAILogsByUserId(
  userId: string,
  limit = 60,
): Promise<AILogRow[]> {
  const query = `ai_logs?select=id,user_id,action,input_text,output_text,created_at&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`;
  return request<AILogRow[]>(query, { method: "GET" });
}
