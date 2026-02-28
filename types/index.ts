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
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  body: string;
  userId: string;
  imageFile: File | null;
}

export interface UpdatePostInput {
  id: ID;
  platform: PostPlatform;
  title?: string;
  caption: string;
  image_url?: string;
  status: PostStatus;
  scheduled_date?: string;
  scheduled_time?: string;
}

export interface AIPlanRequest {
  prompt: string;
}

export interface AIPlanResponse {
  plan: string;
}
