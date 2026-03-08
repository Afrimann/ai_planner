import { randomUUID } from "crypto";
import { extname } from "path";

import type { Database } from "@/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
type AILogRow = Database["public"]["Tables"]["ai_logs"]["Row"];
type AILogInsert = Database["public"]["Tables"]["ai_logs"]["Insert"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
type WorkspaceMemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type WorkspaceMemberInsert =
  Database["public"]["Tables"]["workspace_members"]["Insert"];
type WorkspaceMemberUpdate =
  Database["public"]["Tables"]["workspace_members"]["Update"];
type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

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

export function getSupabaseEnv() {
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

  // basic sanity check so we don't accidentally talk to ourselves
  if (!url.includes("supabase.co")) {
    console.warn(
      "getSupabaseEnv: URL does not look like a Supabase endpoint",
      url,
    );
  }

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

  if (rawMessage.includes("Could not find the table 'public.workspaces'")) {
    return "Supabase table public.workspaces is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  if (
    rawMessage.includes("Could not find the table 'public.workspace_members'")
  ) {
    return "Supabase table public.workspace_members is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  if (rawMessage.includes("Could not find the table 'public.reports'")) {
    return "Supabase table public.reports is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  if (rawMessage.includes("Could not find the table 'public.activities'")) {
    return "Supabase table public.activities is missing in the connected project. Run supabase/schema.sql in your Supabase SQL editor (or apply migrations), then retry.";
  }

  return rawMessage || `Supabase request failed (${status}).`;
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

function encodeFilterValue(value: string): string {
  return encodeURIComponent(value);
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

function toAbsoluteStorageSignedUrl(
  baseUrl: string,
  signedUrl: string,
): string {
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
  "id,user_id,workspace_id,platform,title,caption,body,image_url,status,scheduled_date,scheduled_time,created_at,updated_at,published";
const aiLogColumns =
  "id,user_id,workspace_id,action,input_text,output_text,created_at";

function buildWorkspaceScopeFilter(workspaceId: string | null | undefined): string {
  if (workspaceId === undefined) {
    return "";
  }

  if (workspaceId === null) {
    return "&workspace_id=is.null";
  }

  return `&workspace_id=eq.${encodeFilterValue(workspaceId)}`;
}

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

export async function insertPost(post: PostInsert): Promise<PostRow> {
  const rows = await request<PostRow[]>("posts", {
    method: "POST",
    body: JSON.stringify(post),
  });

  return rows[0];
}

export async function updatePostByIdForUser(
  id: string,
  userId: string,
  workspaceId: string | null | undefined = undefined,
  update: PostUpdate,
): Promise<void> {
  const workspaceFilter = buildWorkspaceScopeFilter(workspaceId);
  const query = `posts?id=eq.${id}&user_id=eq.${userId}${workspaceFilter}`;
  await request<PostRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

// helper queries that the higher-level `lib/posts.ts` module uses.  they
// encode the additional filters that are required by the application
// (user ownership, date ranges, etc.).

export async function selectPostsByUserId(
  userId: string,
  workspaceId?: string | null,
): Promise<PostRow[]> {
  const workspaceFilter = buildWorkspaceScopeFilter(workspaceId);
  const query = `posts?select=${postColumns}&user_id=eq.${userId}${workspaceFilter}&order=created_at.desc`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostsByUserIds(
  userIds: string[],
  limit = 5000,
): Promise<PostRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const inClause = userIds.map((id) => encodeFilterValue(id)).join(",");
  const query = `posts?select=${postColumns}&user_id=in.(${inClause})&order=created_at.desc&limit=${limit}`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostsByWorkspaceId(
  workspaceId: string,
  limit = 5000,
): Promise<PostRow[]> {
  const query = `posts?select=${postColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&order=created_at.desc&limit=${limit}`;
  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostByIdForUser(
  id: string,
  userId: string,
  workspaceId?: string | null,
): Promise<PostRow | null> {
  const workspaceFilter = buildWorkspaceScopeFilter(workspaceId);
  const query = `posts?select=${postColumns}&id=eq.${id}&user_id=eq.${userId}${workspaceFilter}&limit=1`;
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
  workspaceId?: string | null,
): Promise<void> {
  const workspaceFilter = buildWorkspaceScopeFilter(workspaceId);
  const query = `posts?id=eq.${id}&user_id=eq.${userId}${workspaceFilter}`;
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
  workspaceId: string | null | undefined,
  limit = 60,
): Promise<AILogRow[]> {
  const workspaceFilter = buildWorkspaceScopeFilter(workspaceId);
  const query = `ai_logs?select=${aiLogColumns}&user_id=eq.${userId}${workspaceFilter}&order=created_at.desc&limit=${limit}`;
  return request<AILogRow[]>(query, { method: "GET" });
}

export async function selectAILogsByUserIds(
  userIds: string[],
  limit = 5000,
): Promise<AILogRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const inClause = userIds.map((id) => encodeFilterValue(id)).join(",");
  const query = `ai_logs?select=${aiLogColumns}&user_id=in.(${inClause})&order=created_at.desc&limit=${limit}`;
  return request<AILogRow[]>(query, { method: "GET" });
}

export async function selectAILogsByWorkspaceId(
  workspaceId: string,
  limit = 5000,
): Promise<AILogRow[]> {
  const query = `ai_logs?select=${aiLogColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&order=created_at.desc&limit=${limit}`;
  return request<AILogRow[]>(query, { method: "GET" });
}

const workspaceColumns = "id,name,owner_id,created_at";
const workspaceMemberColumns =
  "id,workspace_id,user_id,email,role,status,invited_by,invited_at";
const reportColumns = "id,workspace_id,title,type,created_at,created_by";
const activityColumns =
  "id,actor_id,workspace_id,action,entity_type,entity_id,metadata,created_at";

export async function selectWorkspaceById(id: string): Promise<WorkspaceRow | null> {
  const query = `workspaces?select=${workspaceColumns}&id=eq.${encodeFilterValue(id)}&limit=1`;
  const rows = await request<WorkspaceRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function selectWorkspacesByOwnerId(
  ownerId: string,
): Promise<WorkspaceRow[]> {
  const query = `workspaces?select=${workspaceColumns}&owner_id=eq.${encodeFilterValue(ownerId)}&order=created_at.desc`;
  return request<WorkspaceRow[]>(query, { method: "GET" });
}

export async function selectWorkspacesByIds(ids: string[]): Promise<WorkspaceRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const inClause = ids.map((id) => encodeFilterValue(id)).join(",");
  const query = `workspaces?select=${workspaceColumns}&id=in.(${inClause})&order=created_at.desc`;
  return request<WorkspaceRow[]>(query, { method: "GET" });
}

export async function insertWorkspace(workspace: WorkspaceInsert): Promise<WorkspaceRow> {
  const rows = await request<WorkspaceRow[]>("workspaces", {
    method: "POST",
    body: JSON.stringify(workspace),
  });

  return rows[0];
}

export async function selectWorkspaceMembersByUserId(
  userId: string,
  status?: Database["public"]["Enums"]["workspace_member_status"],
): Promise<WorkspaceMemberRow[]> {
  const statusFilter = status ? `&status=eq.${status}` : "";
  const query = `workspace_members?select=${workspaceMemberColumns}&user_id=eq.${encodeFilterValue(userId)}${statusFilter}&order=invited_at.desc`;
  return request<WorkspaceMemberRow[]>(query, { method: "GET" });
}

export async function selectWorkspaceMembersByEmail(
  email: string,
  status?: Database["public"]["Enums"]["workspace_member_status"],
): Promise<WorkspaceMemberRow[]> {
  const statusFilter = status ? `&status=eq.${status}` : "";
  const query = `workspace_members?select=${workspaceMemberColumns}&email=eq.${encodeFilterValue(email)}${statusFilter}&order=invited_at.desc`;
  return request<WorkspaceMemberRow[]>(query, { method: "GET" });
}

export async function selectWorkspaceMembersByWorkspaceId(
  workspaceId: string,
  status?: Database["public"]["Enums"]["workspace_member_status"],
): Promise<WorkspaceMemberRow[]> {
  const statusFilter = status ? `&status=eq.${status}` : "";
  const query = `workspace_members?select=${workspaceMemberColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}${statusFilter}&order=invited_at.desc`;
  return request<WorkspaceMemberRow[]>(query, { method: "GET" });
}

export async function selectWorkspaceMemberByWorkspaceAndEmail(
  workspaceId: string,
  email: string,
): Promise<WorkspaceMemberRow | null> {
  const query = `workspace_members?select=${workspaceMemberColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&email=eq.${encodeFilterValue(email)}&limit=1`;
  const rows = await request<WorkspaceMemberRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function selectWorkspaceMemberByWorkspaceAndUserId(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMemberRow | null> {
  const query = `workspace_members?select=${workspaceMemberColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&user_id=eq.${encodeFilterValue(userId)}&limit=1`;
  const rows = await request<WorkspaceMemberRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function insertWorkspaceMember(
  member: WorkspaceMemberInsert,
): Promise<WorkspaceMemberRow> {
  const rows = await request<WorkspaceMemberRow[]>("workspace_members", {
    method: "POST",
    body: JSON.stringify(member),
  });

  return rows[0];
}

export async function updateWorkspaceMemberById(
  id: string,
  update: WorkspaceMemberUpdate,
): Promise<WorkspaceMemberRow | null> {
  const query = `workspace_members?id=eq.${encodeFilterValue(id)}`;
  const rows = await request<WorkspaceMemberRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
  return rows[0] ?? null;
}

export async function deleteWorkspaceMemberById(id: string): Promise<void> {
  const query = `workspace_members?id=eq.${encodeFilterValue(id)}`;
  await request<void>(query, { method: "DELETE" });
}

export async function selectReportsByWorkspaceId(
  workspaceId: string,
  limit = 50,
): Promise<ReportRow[]> {
  const query = `reports?select=${reportColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&order=created_at.desc&limit=${limit}`;
  return request<ReportRow[]>(query, { method: "GET" });
}

export async function selectReportByIdAndWorkspaceId(
  reportId: string,
  workspaceId: string,
): Promise<ReportRow | null> {
  const query = `reports?select=${reportColumns}&id=eq.${encodeFilterValue(reportId)}&workspace_id=eq.${encodeFilterValue(workspaceId)}&limit=1`;
  const rows = await request<ReportRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function insertReport(report: ReportInsert): Promise<ReportRow> {
  const rows = await request<ReportRow[]>("reports", {
    method: "POST",
    body: JSON.stringify(report),
  });
  return rows[0];
}

export async function insertActivity(activity: ActivityInsert): Promise<ActivityRow> {
  const rows = await request<ActivityRow[]>("activities", {
    method: "POST",
    body: JSON.stringify(activity),
  });
  return rows[0];
}

export async function selectUserActivities(
  userId: string,
  limit = 10,
): Promise<ActivityRow[]> {
  const query = `activities?select=${activityColumns}&actor_id=eq.${encodeFilterValue(userId)}&workspace_id=is.null&order=created_at.desc&limit=${limit}`;
  return request<ActivityRow[]>(query, { method: "GET" });
}

export async function selectWorkspaceActivities(
  workspaceId: string,
  limit = 10,
): Promise<ActivityRow[]> {
  const query = `activities?select=${activityColumns}&workspace_id=eq.${encodeFilterValue(workspaceId)}&order=created_at.desc&limit=${limit}`;
  return request<ActivityRow[]>(query, { method: "GET" });
}
