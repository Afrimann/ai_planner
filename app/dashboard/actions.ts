"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAuthenticatedUser, requireAuthenticatedUserId } from "@/lib/auth";
import { createActivity } from "@/lib/activities";
import { createPost, setPostStatus } from "@/lib/posts";
import { createWorkspaceReportForUser } from "@/lib/reports";
import { findAuthUserByEmail } from "@/lib/supabase-auth";
import {
  createWorkspaceInvitation,
  isWorkspaceRole,
  normalizeWorkspaceEmail,
  requireWorkspaceAdminOrOwner,
  type WorkspaceMemberRole,
} from "@/lib/workspaces";
import { rewriteCaption } from "@/lib/ai/service";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";
import { insertAILog, insertWorkspace, insertWorkspaceMember } from "@/supabase/client";
import type { PostPlatform, PostStatus } from "@/types";

const allowedPlatforms: readonly PostPlatform[] = [
  "instagram",
  "linkedin",
  "twitter",
];
const allowedStatuses: readonly PostStatus[] = ["draft", "planned", "posted"];

export interface DashboardMutationState {
  status: "idle" | "success" | "error";
  message?: string;
  workspaceId?: string;
  reportId?: string;
  reportDownloadUrl?: string;
  timestamp: number;
}

function isNetworkTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  if (message.includes("connect timeout") || message.includes("fetch failed")) {
    return true;
  }

  const cause = (
    error as Error & {
      cause?: {
        code?: string;
      };
    }
  ).cause;

  return cause?.code === "UND_ERR_CONNECT_TIMEOUT";
}

function normalizeDashboardMutationError(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (isNetworkTimeoutError(error)) {
    return "We could not reach the server in time. Your request may still have completed. Refresh this page to confirm before retrying.";
  }

  if (message === "Unauthorized") {
    return "Your session has expired. Sign in again and retry.";
  }

  if (message.toLowerCase().includes("workspace access denied")) {
    return "You do not have access to this workspace.";
  }
  if (message.toLowerCase().includes("workspace admins")) {
    return "Only workspace admins can perform this action.";
  }

  return message || fallback;
}

function mutationSuccess(
  message: string,
  extra?: Partial<DashboardMutationState>,
): DashboardMutationState {
  return {
    status: "success",
    message,
    timestamp: Date.now(),
    ...extra,
  };
}

function mutationError(message: string): DashboardMutationState {
  return {
    status: "error",
    message,
    timestamp: Date.now(),
  };
}

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

async function logDashboardPostStatusActivity(input: {
  userId: string;
  workspaceId: string | null;
  postId: string;
  status: "draft" | "planned" | "posted";
  scheduledDate?: string;
  scheduledTime?: string;
}): Promise<void> {
  if (input.status === "planned") {
    await createActivity({
      actorId: input.userId,
      workspaceId: input.workspaceId,
      action: "post_scheduled",
      entityType: "post",
      entityId: input.postId,
      metadata: {
        scheduled_date: input.scheduledDate ?? null,
        scheduled_time: input.scheduledTime ?? null,
      },
    });
    return;
  }

  if (input.status === "posted") {
    await createActivity({
      actorId: input.userId,
      workspaceId: input.workspaceId,
      action: "post_published",
      entityType: "post",
      entityId: input.postId,
      metadata: {},
    });
  }
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
    const userId = await requireAuthenticatedUserId();
    const workspaceId = await resolveActiveWorkspaceIdForUser(userId);
    const imageFile = readImageFile(formData, "image");
    const postId = await createPost({
      platform: normalizedPlatform,
      title,
      caption,
      image_url: imageUrl,
      imageFile,
      status: normalizedStatus,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    });
    await createActivity({
      actorId: userId,
      workspaceId,
      action: "post_created",
      entityType: "post",
      entityId: postId,
      metadata: {
        platform: normalizedPlatform,
        status: normalizedStatus,
      },
    });
    await logDashboardPostStatusActivity({
      userId,
      workspaceId,
      postId,
      status: normalizedStatus,
      scheduledDate,
      scheduledTime,
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
    const workspaceId = await resolveActiveWorkspaceIdForUser(userId);
    const generatedCaption = await rewriteCaption(prompt);

    await insertAILog({
      user_id: userId,
      workspace_id: workspaceId,
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
  const userId = await requireAuthenticatedUserId();
  const workspaceId = await resolveActiveWorkspaceIdForUser(userId);
  await logDashboardPostStatusActivity({
    userId,
    workspaceId,
    postId: id,
    status,
  });
  revalidatePath("/dashboard");
  revalidatePath("/posts");
}

export async function inviteWorkspaceMember(
  email: string,
  workspaceId: string,
  role: WorkspaceMemberRole,
): Promise<{
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceMemberRole;
  status: "pending" | "active";
}> {
  const inviterId = await requireAuthenticatedUserId();
  const normalizedEmail = normalizeWorkspaceEmail(email);

  if (!workspaceId.trim()) {
    throw new Error("Workspace is required.");
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("A valid invitation email is required.");
  }
  if (!isWorkspaceRole(role)) {
    throw new Error("Invalid workspace role.");
  }

  await requireWorkspaceAdminOrOwner(inviterId, workspaceId);

  const existingAuthUser = await findAuthUserByEmail(normalizedEmail);
  const createdMember = await createWorkspaceInvitation({
    workspaceId: workspaceId.trim(),
    email: normalizedEmail,
    role,
    invitedBy: inviterId,
    invitedUserId: existingAuthUser?.id ?? null,
  });

  await createActivity({
    actorId: inviterId,
    workspaceId: workspaceId.trim(),
    action: "invite_member",
    entityType: "workspace_member",
    entityId: createdMember.id,
    metadata: {
      email: createdMember.email,
      role: createdMember.role,
      status: createdMember.status,
      invited_user_id: createdMember.user_id,
    },
  });

  revalidatePath("/dashboard");

  return {
    id: createdMember.id,
    workspace_id: createdMember.workspace_id,
    email: createdMember.email,
    role: createdMember.role,
    status: createdMember.status,
  };
}

export async function inviteWorkspaceMemberAction(
  _prevState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const email = readString(formData, "email");
  const workspaceId = readString(formData, "workspaceId");
  const roleRaw = readString(formData, "role");
  const role: WorkspaceMemberRole = isWorkspaceRole(roleRaw) ? roleRaw : "member";

  if (!workspaceId) {
    return mutationError("Select a workspace before sending an invitation.");
  }

  if (!email) {
    return mutationError("Enter an email address to send an invitation.");
  }

  try {
    const invited = await inviteWorkspaceMember(email, workspaceId, role);
    return mutationSuccess(`Invitation sent to ${invited.email}.`);
  } catch (error) {
    return mutationError(
      normalizeDashboardMutationError(error, "Failed to invite member."),
    );
  }
}

export async function createWorkspaceReportAction(
  _prevState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const workspaceId = readString(formData, "workspaceId");
  const title = readString(formData, "title");
  const type = readString(formData, "type");

  if (!workspaceId) {
    return mutationError("Select a workspace before creating a report.");
  }

  if (!title) {
    return mutationError("Report title is required.");
  }

  if (!type) {
    return mutationError("Report type is required.");
  }

  try {
    const userId = await requireAuthenticatedUserId();
    const report = await createWorkspaceReportForUser(userId, workspaceId, {
      title,
      type,
    });
    const normalizedWorkspaceId = workspaceId.trim();
    revalidatePath("/dashboard");
    return mutationSuccess("Report generated successfully.", {
      workspaceId: normalizedWorkspaceId,
      reportId: report.id,
      reportDownloadUrl: `/api/workspaces/${normalizedWorkspaceId}/reports/${report.id}/download`,
    });
  } catch (error) {
    return mutationError(
      normalizeDashboardMutationError(error, "Failed to create report."),
    );
  }
}

export async function createWorkspaceAction(
  _prevState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const name = readString(formData, "workspaceName");

  if (!name) {
    return mutationError("Workspace name is required.");
  }

  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return mutationError("Your session has expired. Sign in again and retry.");
  }

  try {
    const workspace = await insertWorkspace({
      name,
      owner_id: user.id,
    });

    await insertWorkspaceMember({
      workspace_id: workspace.id,
      user_id: user.id,
      email: (user.email ?? `${user.id}@local`).toLowerCase(),
      role: "owner",
      status: "active",
      invited_by: user.id,
    });

    await createActivity({
      actorId: user.id,
      workspaceId: workspace.id,
      action: "workspace_created",
      entityType: "workspace",
      entityId: workspace.id,
      metadata: {
        name: workspace.name,
      },
    });

    revalidatePath("/dashboard");

    return mutationSuccess(`Workspace "${workspace.name}" created.`, {
      workspaceId: workspace.id,
    });
  } catch (error) {
    return mutationError(
      normalizeDashboardMutationError(error, "Failed to create workspace."),
    );
  }
}
