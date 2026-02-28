import type { Database } from "@/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

interface SupabaseResponse<T> {
  data: T;
  error: null;
}

interface SupabaseErrorResponse {
  error: {
    message: string;
  };
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
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
    throw new Error(body?.error?.message ?? `Supabase request failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function selectPosts(): Promise<PostRow[]> {
  const query = "posts?select=id,title,body,created_at,updated_at,published&order=created_at.desc";
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostById(id: string): Promise<PostRow | null> {
  const query = `posts?select=id,title,body,created_at,updated_at,published&id=eq.${id}&limit=1`;
  const rows = await request<PostRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function insertPost(post: PostInsert): Promise<void> {
  await request<SupabaseResponse<PostRow[]>>("posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function updatePostById(id: string, update: PostUpdate): Promise<void> {
  const query = `posts?id=eq.${id}`;
  await request<SupabaseResponse<PostRow[]>>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export async function deletePostById(id: string): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  const response = await fetch(`${url}/rest/v1/posts?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete post (${response.status}).`);
  }
}
