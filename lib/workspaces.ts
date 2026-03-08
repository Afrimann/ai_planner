import type { Database } from "@/supabase/database.types";
import {
  deleteWorkspaceMemberById,
  insertWorkspaceMember,
  selectWorkspaceById,
  selectWorkspaceMemberByWorkspaceAndEmail,
  selectWorkspaceMemberByWorkspaceAndUserId,
  selectWorkspaceMembersByEmail,
  selectWorkspaceMembersByUserId,
  selectWorkspaceMembersByWorkspaceId,
  selectWorkspacesByIds,
  selectWorkspacesByOwnerId,
  updateWorkspaceMemberById,
} from "@/supabase/client";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceMemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];

export type WorkspaceMemberRole = Database["public"]["Enums"]["workspace_member_role"];
export type WorkspaceMemberStatus =
  Database["public"]["Enums"]["workspace_member_status"];

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  invited_by: string;
  invited_at: string;
}

export interface WorkspaceAccess {
  workspace: Workspace;
  role: WorkspaceMemberRole;
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    owner_id: row.owner_id,
    created_at: row.created_at,
  };
}

function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    email: row.email,
    role: row.role,
    status: row.status,
    invited_by: row.invited_by,
    invited_at: row.invited_at,
  };
}

export function normalizeWorkspaceEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isWorkspaceRole(value: string): value is WorkspaceMemberRole {
  return value === "owner" || value === "admin" || value === "member";
}

export async function listUserWorkspaces(userId: string): Promise<Workspace[]> {
  const [owned, activeMemberships] = await Promise.all([
    selectWorkspacesByOwnerId(userId),
    selectWorkspaceMembersByUserId(userId, "active"),
  ]);

  const workspaceIds = new Set<string>();
  for (const workspace of owned) {
    workspaceIds.add(workspace.id);
  }
  for (const member of activeMemberships) {
    workspaceIds.add(member.workspace_id);
  }

  const rows = await selectWorkspacesByIds(Array.from(workspaceIds));
  const byId = new Map<string, Workspace>();

  for (const row of rows) {
    byId.set(row.id, mapWorkspace(row));
  }
  for (const row of owned) {
    byId.set(row.id, mapWorkspace(row));
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export async function listUserWorkspaceAccess(
  userId: string,
): Promise<WorkspaceAccess[]> {
  const [workspaces, memberships] = await Promise.all([
    listUserWorkspaces(userId),
    selectWorkspaceMembersByUserId(userId, "active"),
  ]);

  const roleByWorkspaceId = new Map<string, WorkspaceMemberRole>();

  for (const membership of memberships) {
    roleByWorkspaceId.set(membership.workspace_id, membership.role);
  }

  for (const workspace of workspaces) {
    if (workspace.owner_id === userId) {
      roleByWorkspaceId.set(workspace.id, "owner");
    }
  }

  return workspaces.map((workspace) => ({
    workspace,
    role: roleByWorkspaceId.get(workspace.id) ?? "member",
  }));
}

export async function getWorkspaceRoleForUser(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMemberRole | null> {
  const workspace = await selectWorkspaceById(workspaceId);

  if (!workspace) {
    return null;
  }

  if (workspace.owner_id === userId) {
    return "owner";
  }

  const membership = await selectWorkspaceMemberByWorkspaceAndUserId(
    workspaceId,
    userId,
  );

  if (!membership || membership.status !== "active") {
    return null;
  }

  return membership.role;
}

export async function getWorkspaceForUser(
  userId: string,
  workspaceId: string,
): Promise<Workspace | null> {
  const workspace = await selectWorkspaceById(workspaceId);

  if (!workspace) {
    return null;
  }

  if (workspace.owner_id === userId) {
    return mapWorkspace(workspace);
  }

  const membership = await selectWorkspaceMemberByWorkspaceAndUserId(
    workspaceId,
    userId,
  );

  if (!membership || membership.status !== "active") {
    return null;
  }

  return mapWorkspace(workspace);
}

export async function requireWorkspaceForUser(
  userId: string,
  workspaceId: string,
): Promise<Workspace> {
  const workspace = await getWorkspaceForUser(userId, workspaceId);

  if (!workspace) {
    throw new Error("Workspace access denied.");
  }

  return workspace;
}

export async function requireWorkspaceAdminOrOwner(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMemberRole> {
  const role = await getWorkspaceRoleForUser(userId, workspaceId);

  if (!role) {
    throw new Error("Workspace access denied.");
  }

  if (role !== "owner" && role !== "admin") {
    throw new Error("Only workspace admins can perform this action.");
  }

  return role;
}

export async function listWorkspaceMembersForUser(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const workspace = await requireWorkspaceForUser(userId, workspaceId);
  const rows = await selectWorkspaceMembersByWorkspaceId(workspaceId);
  const mapped = rows.map(mapWorkspaceMember);

  const hasOwnerInRows = mapped.some(
    (member) => member.user_id === workspace.owner_id && member.role === "owner",
  );

  if (!hasOwnerInRows) {
    mapped.unshift({
      id: `owner-${workspace.id}`,
      workspace_id: workspace.id,
      user_id: workspace.owner_id,
      email: "",
      role: "owner",
      status: "active",
      invited_by: workspace.owner_id,
      invited_at: workspace.created_at,
    });
  }

  return mapped.sort((a, b) => b.invited_at.localeCompare(a.invited_at));
}

export async function acceptPendingWorkspaceInvitationsForUser(
  userId: string,
  email: string,
): Promise<number> {
  const normalizedEmail = normalizeWorkspaceEmail(email);

  if (!normalizedEmail) {
    return 0;
  }

  const pendingInvites = await selectWorkspaceMembersByEmail(
    normalizedEmail,
    "pending",
  );

  let accepted = 0;

  for (const invite of pendingInvites) {
    const existingMembership = await selectWorkspaceMemberByWorkspaceAndUserId(
      invite.workspace_id,
      userId,
    );

    if (existingMembership?.status === "active") {
      await deleteWorkspaceMemberById(invite.id);
      continue;
    }

    await updateWorkspaceMemberById(invite.id, {
      user_id: userId,
      email: normalizedEmail,
      status: "active",
    });
    accepted += 1;
  }

  return accepted;
}

export async function createWorkspaceInvitation(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceMemberRole;
  invitedBy: string;
  invitedUserId?: string | null;
}): Promise<WorkspaceMember> {
  const normalizedEmail = normalizeWorkspaceEmail(input.email);

  if (!normalizedEmail) {
    throw new Error("Invitation email is required.");
  }

  const workspace = await selectWorkspaceById(input.workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  if (input.invitedUserId && workspace.owner_id === input.invitedUserId) {
    throw new Error("That user already has workspace owner access.");
  }

  const existingByEmail = await selectWorkspaceMemberByWorkspaceAndEmail(
    input.workspaceId,
    normalizedEmail,
  );

  if (existingByEmail?.status === "active") {
    throw new Error("That email is already an active workspace member.");
  }
  if (existingByEmail?.status === "pending") {
    throw new Error("An invitation for that email is already pending.");
  }

  if (input.invitedUserId) {
    const existingByUser = await selectWorkspaceMemberByWorkspaceAndUserId(
      input.workspaceId,
      input.invitedUserId,
    );

    if (existingByUser?.status === "active") {
      throw new Error("That user is already an active workspace member.");
    }
    if (existingByUser?.status === "pending") {
      throw new Error("That user already has a pending invitation.");
    }
  }

  const created = await insertWorkspaceMember({
    workspace_id: input.workspaceId,
    user_id: input.invitedUserId ?? null,
    email: normalizedEmail,
    role: input.role,
    status: "pending",
    invited_by: input.invitedBy,
  });

  return mapWorkspaceMember(created);
}
