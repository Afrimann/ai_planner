import type { Post } from "@/types";

export type ScheduledPostReminder = Pick<
  Post,
  | "id"
  | "title"
  | "body"
  | "caption"
  | "scheduled_date"
  | "scheduled_time"
  | "user_id"
  | "status"
>;

interface ScheduledPostsApiResponse {
  posts?: ScheduledPostReminder[];
}

export interface ScheduledPostNotificationOptions {
  userId?: string;
  posts?: ScheduledPostReminder[];
  fetchPosts?: () => Promise<ScheduledPostReminder[]>;
  overdueWindowMinutes?: number;
  snippetMinLength?: number;
  snippetMaxLength?: number;
  serviceWorkerPath?: string;
  notificationTagPrefix?: string;
  now?: Date;
}

export interface ScheduledPostNotificationResult {
  hasScheduledPosts: boolean;
  scheduledCount: number;
  dueCount: number;
  notifiedCount: number;
  notifiedPostIds: string[];
  permission: NotificationPermission | "unsupported";
}

const DEFAULT_OVERDUE_WINDOW_MINUTES = 12;
const DEFAULT_SNIPPET_MIN_LENGTH = 50;
const DEFAULT_SNIPPET_MAX_LENGTH = 100;
const DEFAULT_SERVICE_WORKER_PATH = "/post-reminders-sw.js";
const DEFAULT_NOTIFICATION_TAG_PREFIX = "post-reminder";
const NOTIFIED_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function normalizeTime(value?: string): string {
  if (!value) {
    return "00:00";
  }

  const normalized = value.trim();
  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/);
  if (!match) {
    return "00:00";
  }

  return `${match[1]}:${match[2]}`;
}

function toScheduledDate(post: ScheduledPostReminder): Date | null {
  if (!post.scheduled_date) {
    return null;
  }

  const time = normalizeTime(post.scheduled_time);
  const parsed = new Date(`${post.scheduled_date}T${time}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildSnippet(
  post: ScheduledPostReminder,
  minLength: number,
  maxLength: number,
): string {
  const source = (post.caption ?? post.body ?? "").replace(/\s+/g, " ").trim();
  if (!source) {
    return "No caption or body content provided.";
  }

  if (source.length <= maxLength) {
    return source;
  }

  const sliced = source.slice(0, maxLength);
  const lastWordBoundary = sliced.lastIndexOf(" ");
  const safeCut =
    lastWordBoundary >= minLength ? sliced.slice(0, lastWordBoundary) : sliced;

  return `${safeCut.trim()}...`;
}

function formatScheduledLabel(post: ScheduledPostReminder): string {
  const scheduledAt = toScheduledDate(post);
  if (!scheduledAt) {
    return `${post.scheduled_date ?? "Unknown date"} ${normalizeTime(post.scheduled_time)}`;
  }

  return scheduledAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function ensureNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  const state = getPermissionState();
  if (state === "unsupported" || state === "granted" || state === "denied") {
    return state;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

function getNotifiedStorageKey(userId: string): string {
  return `post-reminder:notified:${userId}`;
}

function resolveNotificationUserId(
  userId: string | undefined,
  posts: ScheduledPostReminder[],
): string {
  if (userId && userId.trim()) {
    return userId.trim();
  }

  for (const post of posts) {
    if (typeof post.user_id === "string" && post.user_id.trim()) {
      return post.user_id.trim();
    }
  }

  return "current-user";
}

function readNotifiedMap(userId: string): Record<string, number> {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  const raw = window.localStorage.getItem(getNotifiedStorageKey(userId));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const now = Date.now();
    const cleaned: Record<string, number> = {};

    for (const [key, timestamp] of Object.entries(parsed)) {
      if (
        typeof timestamp === "number" &&
        now - timestamp <= NOTIFIED_CACHE_TTL_MS
      ) {
        cleaned[key] = timestamp;
      }
    }

    return cleaned;
  } catch {
    return {};
  }
}

function writeNotifiedMap(userId: string, value: Record<string, number>): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(getNotifiedStorageKey(userId), JSON.stringify(value));
}

function buildReminderSignature(post: ScheduledPostReminder): string {
  return `${post.id}:${post.scheduled_date ?? ""}:${normalizeTime(post.scheduled_time)}`;
}

function isScheduledCandidate(post: ScheduledPostReminder): boolean {
  return post.status === "planned" && Boolean(post.scheduled_date);
}

function findDueScheduledPosts(
  posts: ScheduledPostReminder[],
  now: Date,
  overdueWindowMinutes: number,
): ScheduledPostReminder[] {
  const nowMs = now.getTime();
  const graceWindowMs = Math.max(1, overdueWindowMinutes) * 60 * 1000;

  return posts.filter((post) => {
    const scheduledAt = toScheduledDate(post);
    if (!scheduledAt) {
      return false;
    }

    const scheduledMs = scheduledAt.getTime();
    return scheduledMs <= nowMs && scheduledMs >= nowMs - graceWindowMs;
  });
}

async function getServiceWorkerRegistration(
  serviceWorkerPath: string,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    let registration =
      (await navigator.serviceWorker.getRegistration(serviceWorkerPath)) ??
      (await navigator.serviceWorker.getRegistration());

    if (!registration) {
      registration = await navigator.serviceWorker.register(serviceWorkerPath);
    }

    if (registration.active || registration.waiting) {
      return registration;
    }

    // Fresh registrations may exist but not be active yet. Wait briefly for
    // readiness and then reuse that active registration when available.
    const readyRegistration = (await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 3000);
      }),
    ])) as ServiceWorkerRegistration | null;

    if (readyRegistration?.active || readyRegistration?.waiting) {
      return readyRegistration;
    }

    return null;
  } catch {
    return null;
  }
}

async function showPostReminderNotification(
  post: ScheduledPostReminder,
  options: {
    snippetMinLength: number;
    snippetMaxLength: number;
    serviceWorkerPath: string;
    notificationTagPrefix: string;
  },
): Promise<boolean> {
  const title = post.title?.trim() || "Untitled Post";
  const snippet = buildSnippet(post, options.snippetMinLength, options.snippetMaxLength);
  const scheduledLabel = formatScheduledLabel(post);
  const body = `${snippet}\nScheduled: ${scheduledLabel}`;
  const tag = `${options.notificationTagPrefix}:${buildReminderSignature(post)}`;

  const notificationOptions: NotificationOptions = {
    body,
    tag,
    data: {
      postId: post.id,
      url: `/posts/${post.id}`,
    },
  };

  // Prefer service-worker notifications so the same code path works with
  // active worker registrations and future push-driven delivery.
  const registration = await getServiceWorkerRegistration(options.serviceWorkerPath);
  if (registration) {
    try {
      await registration.showNotification(title, notificationOptions);
      return true;
    } catch {
      // Fall back to page-level Notification when SW is not active yet.
    }
  }

  try {
    new Notification(title, notificationOptions);
    return true;
  } catch {
    return false;
  }
}

export async function fetchScheduledPostsForCurrentUser(): Promise<
  ScheduledPostReminder[]
> {
  const response = await fetch("/api/posts/scheduled", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Unauthenticated/expired sessions are normal on public pages and
      // immediately after sign-out. Treat as no reminders instead of noise.
      return [];
    }

    throw new Error(`Failed to load scheduled posts (${response.status}).`);
  }

  const payload = (await response.json()) as ScheduledPostsApiResponse;
  return payload.posts ?? [];
}

export async function checkScheduledPostsAndNotify(
  options: ScheduledPostNotificationOptions,
): Promise<ScheduledPostNotificationResult> {
  const now = options.now ?? new Date();
  const overdueWindowMinutes =
    options.overdueWindowMinutes ?? DEFAULT_OVERDUE_WINDOW_MINUTES;
  const snippetMinLength = options.snippetMinLength ?? DEFAULT_SNIPPET_MIN_LENGTH;
  const snippetMaxLength = options.snippetMaxLength ?? DEFAULT_SNIPPET_MAX_LENGTH;
  const serviceWorkerPath =
    options.serviceWorkerPath ?? DEFAULT_SERVICE_WORKER_PATH;
  const notificationTagPrefix =
    options.notificationTagPrefix ?? DEFAULT_NOTIFICATION_TAG_PREFIX;

  const sourcePosts =
    options.posts ??
    (await (options.fetchPosts ?? fetchScheduledPostsForCurrentUser)());
  const notificationUserId = resolveNotificationUserId(options.userId, sourcePosts);

  const scheduledPosts = sourcePosts.filter(isScheduledCandidate);
  const duePosts = findDueScheduledPosts(scheduledPosts, now, overdueWindowMinutes);
  let permission = getPermissionState();

  // Ask early when the user has at least one scheduled post so they do not
  // miss reminders at the exact scheduled moment.
  if (scheduledPosts.length > 0 && permission === "default") {
    permission = await ensureNotificationPermission();
  }

  const baseResult: ScheduledPostNotificationResult = {
    hasScheduledPosts: scheduledPosts.length > 0,
    scheduledCount: scheduledPosts.length,
    dueCount: duePosts.length,
    notifiedCount: 0,
    notifiedPostIds: [],
    permission,
  };

  if (duePosts.length === 0) {
    return baseResult;
  }

  if (permission !== "granted") {
    return {
      ...baseResult,
      permission,
    };
  }

  const notifiedMap = readNotifiedMap(notificationUserId);
  const notifiedPostIds: string[] = [];

  for (const post of duePosts) {
    const signature = buildReminderSignature(post);
    if (notifiedMap[signature]) {
      continue;
    }

    const sent = await showPostReminderNotification(post, {
      snippetMinLength,
      snippetMaxLength,
      serviceWorkerPath,
      notificationTagPrefix,
    });

    if (!sent) {
      continue;
    }

    notifiedMap[signature] = Date.now();
    notifiedPostIds.push(post.id);
  }

  writeNotifiedMap(notificationUserId, notifiedMap);

  return {
    ...baseResult,
    notifiedCount: notifiedPostIds.length,
    notifiedPostIds,
    permission,
  };
}
