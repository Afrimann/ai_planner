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

export interface Post {
  id: ID;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export interface CreatePostInput {
  title: string;
  body: string;
}

export interface UpdatePostInput {
  id: ID;
  title: string;
  body: string;
  published: boolean;
}

export interface AIPlanRequest {
  prompt: string;
}

export interface AIPlanResponse {
  plan: string;
}
