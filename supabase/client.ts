import { randomUUID } from "crypto";
import { extname } from "path";

import type { Database } from "@/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
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

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "post-images";

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey, storageBucket };
}

function parseErrorMessage(body: SupabaseErrorResponse | null, status: number): string {
  return body?.error?.message ?? body?.message ?? `Supabase request failed (${status}).`;
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
    const body = (await response.json().catch(() => null)) as SupabaseErrorResponse | null;
    throw new Error(parseErrorMessage(body, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const postColumns =
  "id,title,body,caption,image_url,scheduled_date,created_at,updated_at,published";

export async function selectPosts(): Promise<PostRow[]> {
  const query = "posts?select=id,title,body,image_url,created_at,updated_at,published&order=created_at.desc";
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostById(id: string): Promise<PostRow | null> {
  const query = `posts?select=id,title,body,image_url,created_at,updated_at,published&id=eq.${id}&limit=1`;
  const rows = await request<PostRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const { url, serviceRoleKey, storageBucket } = getSupabaseEnv();
  const fileExt = extname(file.name) || ".bin";
  const objectPath = `${userId}/${randomUUID()}${fileExt}`;

  const response = await fetch(`${url}/storage/v1/object/${storageBucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SupabaseErrorResponse | null;
    throw new Error(body?.error?.message ?? "Failed to upload image to storage.");
  }

  const publicUrl = `${url}/storage/v1/object/public/${storageBucket}/${objectPath}`;
  return publicUrl;
}

export async function insertPost(post: PostInsert): Promise<void> {
  await request<PostRow[]>("posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function updatePostByIdForUser(id: string, userId: string, update: PostUpdate): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<PostRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export async function deletePostByIdForUser(id: string, userId: string): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<void>(query, {
    method: "DELETE",
  });
}

export async function insertAILog(log: AILogInsert): Promise<void> {
  await request<SupabaseResponse<AILogInsert[]>>("ai_logs", {
    method: "POST",
    body: JSON.stringify(log),
  });
}
