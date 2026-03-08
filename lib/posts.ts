import {
  deletePostByIdForUser,
  insertPost,
  resolveImageUrlForDisplay,
  selectPostsByUserId,
  selectPostByIdForUser,
  updatePostByIdForUser,
  uploadPostImage,
} from "@/supabase/client";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types";
import type { Database } from "@/supabase/database.types";
import { requireAuthenticatedUserId } from "@/lib/auth";
import { warnPostManagementSupabaseSetup } from "@/lib/supabase-setup";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";

// row type directly corresponds to the database's posts row.
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PostScopeOptions {
  workspaceId?: string | null;
  includeAllScopes?: boolean;
}

function normalizePostId(id: string): string {
  return id.trim();
}

function isValidPostId(id: string): boolean {
  return uuidPattern.test(id);
}

function hasExplicitWorkspaceScope(
  options?: PostScopeOptions,
): options is PostScopeOptions & { workspaceId: string | null } {
  return Boolean(options && Object.prototype.hasOwnProperty.call(options, "workspaceId"));
}

async function resolveWorkspaceScopeForUser(
  userId: string,
  options?: PostScopeOptions,
): Promise<string | null | undefined> {
  if (options?.includeAllScopes) {
    return undefined;
  }

  if (hasExplicitWorkspaceScope(options)) {
    return options.workspaceId ?? null;
  }

  return resolveActiveWorkspaceIdForUser(userId);
}

async function toPost(row: PostRow): Promise<Post> {
  const imageUrl = await resolveImageUrlForDisplay(row.image_url);

  // the generic `row` coming from the supabase client already matches
  // our `Post` type thanks to the updated database.types.ts, however
  // we make a very small normalization step so that optional fields are
  // undefined instead of null which plays more nicely with React.
  return {
    ...row,
    title: row.title ?? undefined,
    caption: row.caption ?? row.body,
    scheduled_date: row.scheduled_date ?? undefined,
    scheduled_time: row.scheduled_time ?? undefined,
    image_url: imageUrl,
  } as Post;
}

export async function listPostsForAuthenticatedUser(
  options?: PostScopeOptions,
): Promise<Post[]> {
  const userId = await requireAuthenticatedUserId();
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, options);
  const rows = await selectPostsByUserId(userId, workspaceScope);
  return Promise.all(rows.map(toPost));
}

export async function listTodayPosts(): Promise<Post[]> {
  const userId = await requireAuthenticatedUserId();
  const today = new Date().toISOString().slice(0, 10);
  const workspaceScope = await resolveWorkspaceScopeForUser(userId);
  const rows = await selectPostsByUserId(userId, workspaceScope);
  const filteredRows = rows.filter((row) => row.scheduled_date === today);
  return Promise.all(filteredRows.map(toPost));
}

export async function listUpcomingPosts(): Promise<Post[]> {
  const userId = await requireAuthenticatedUserId();
  const start = new Date();
  start.setDate(start.getDate() + 1);

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const workspaceScope = await resolveWorkspaceScopeForUser(userId);
  const rows = await selectPostsByUserId(userId, workspaceScope);

  const filteredRows = rows.filter((row) => {
    if (!row.scheduled_date) {
      return false;
    }

    return row.scheduled_date >= startDate && row.scheduled_date <= endDate;
  });

  return Promise.all(filteredRows.map(toPost));
}

export async function getPostById(
  id: string,
  options?: PostScopeOptions,
): Promise<Post | null> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    return null;
  }

  const userId = await requireAuthenticatedUserId();
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, options);
  const row = await selectPostByIdForUser(postId, userId, workspaceScope);
  return row ? toPost(row) : null;
}

export async function createPost(
  input: CreatePostInput,
  options?: PostScopeOptions,
): Promise<string> {
  warnPostManagementSupabaseSetup();

  const userId = await requireAuthenticatedUserId();
  const explicitWorkspaceId =
    typeof input.workspace_id === "string"
      ? (input.workspace_id.trim() || null)
      : undefined;
  const scopeOptions =
    explicitWorkspaceId === undefined
      ? options
      : {
          ...(options ?? {}),
          workspaceId: explicitWorkspaceId,
        };
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, scopeOptions);
  let imageUrl: string | null = null;

  if (input.imageFile) {
    imageUrl = await uploadPostImage(userId, input.imageFile);
  } else if (input.image_url) {
    imageUrl = input.image_url;
  }

  const created = await insertPost({
    user_id: userId,
    workspace_id: workspaceScope ?? null,
    platform: input.platform,
    title: input.title || "",
    caption: input.caption,
    body: input.caption,
    image_url: imageUrl,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    published: input.status === "posted",
  });

  return created.id;
}

export async function updatePost(
  input: UpdatePostInput,
  options?: PostScopeOptions,
): Promise<void> {
  const postId = normalizePostId(input.id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();
  const explicitWorkspaceId =
    typeof input.workspace_id === "string"
      ? (input.workspace_id.trim() || null)
      : undefined;
  const scopeOptions =
    explicitWorkspaceId === undefined
      ? options
      : {
          ...(options ?? {}),
          workspaceId: explicitWorkspaceId,
        };
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, scopeOptions);
  let imageUrl = input.image_url ?? null;

  if (input.imageFile) {
    imageUrl = await uploadPostImage(userId, input.imageFile);
  }

  await updatePostByIdForUser(postId, userId, workspaceScope, {
    platform: input.platform,
    title: input.title,
    caption: input.caption,
    body: input.caption,
    image_url: imageUrl,
    status: input.status,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    published: input.published,
    updated_at: new Date().toISOString(),
  });
}

export async function setPostStatus(
  id: string,
  status: Post["status"],
  options?: PostScopeOptions,
): Promise<void> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, options);

  await updatePostByIdForUser(postId, userId, workspaceScope, {
    status,
    published: status === "posted",
    updated_at: new Date().toISOString(),
  });
}

export async function deletePost(
  id: string,
  options?: PostScopeOptions,
): Promise<void> {
  const postId = normalizePostId(id);
  if (!isValidPostId(postId)) {
    throw new Error("Invalid post id.");
  }

  const userId = await requireAuthenticatedUserId();
  const workspaceScope = await resolveWorkspaceScopeForUser(userId, options);
  const existingPost = await selectPostByIdForUser(postId, userId, workspaceScope);

  if (!existingPost) {
    throw new Error("Post not found or access denied.");
  }

  await deletePostByIdForUser(postId, userId, workspaceScope);
}
