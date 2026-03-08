import type { Json } from "@/supabase/database.types";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { requireWorkspaceForUser } from "@/lib/workspaces";
import {
  insertActivity,
  selectUserActivities,
  selectWorkspaceActivities,
} from "@/supabase/client";

export interface Activity {
  id: string;
  actor_id: string;
  workspace_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Json;
  created_at: string;
}

export interface CreateActivityInput {
  actorId: string;
  workspaceId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Json;
}

function mapActivity(row: Awaited<ReturnType<typeof insertActivity>>): Activity {
  return {
    id: row.id,
    actor_id: row.actor_id,
    workspace_id: row.workspace_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
    created_at: row.created_at,
  };
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const created = await insertActivity({
    actor_id: input.actorId,
    workspace_id: input.workspaceId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });

  return mapActivity(created);
}

export async function getUserActivities(
  userId: string,
  limit = 10,
): Promise<Activity[]> {
  const rows = await selectUserActivities(userId, limit);
  return rows.map((row) => mapActivity(row));
}

export async function getRecentWorkspaceActivityForUser(
  userId: string,
  workspaceId: string,
  limit = 10,
): Promise<Activity[]> {
  await requireWorkspaceForUser(userId, workspaceId);
  const rows = await selectWorkspaceActivities(workspaceId, limit);
  return rows.map((row) => mapActivity(row));
}

export async function getRecentWorkspaceActivity(
  workspaceId: string,
  limit = 10,
): Promise<Activity[]> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return getRecentWorkspaceActivityForUser(user.id, workspaceId, limit);
}
