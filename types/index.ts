export type ID = string;

export interface DashboardMetric {
  id: ID;
  label: string;
  value: string;
  delta: string;
}

export interface CalendarEvent {
  id: ID;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  notes: string;
}

export type PostPlatform = "instagram" | "linkedin" | "twitter";

export type PostStatus = "draft" | "planned" | "posted";

export interface Post {
  id: ID;
  user_id: string;
  workspace_id: string | null;
  platform: PostPlatform;
  title?: string;
  caption: string;
  body: string;
  image_url: string | null;
  status: PostStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  workspace_id?: string | null;
  platform: PostPlatform;
  title?: string;
  caption: string;
  imageFile: File | null;
  image_url?: string;
  status: PostStatus;
  scheduled_date?: string;
  scheduled_time?: string;
}

export interface UpdatePostInput {
  id: ID;
  workspace_id?: string | null;
  platform: PostPlatform;
  title?: string;
  caption: string;
  imageFile?: File | null;
  image_url?: string;
  status: PostStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  published?: boolean;
}

export interface AIPlanRequest {
  prompt: string;
}

export interface AIPlanResponse {
  plan: string;
}
