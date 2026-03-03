"use client";

import { useEffect } from "react";

import type { Post } from "@/types";
import {
  checkScheduledPostsAndNotify,
  fetchScheduledPostsForCurrentUser,
  type ScheduledPostReminder,
} from "@/lib/notifications/post-schedule-notifier";

interface ScheduledPostNotifierProps {
  userId?: string;
  initialPosts?: Post[];
  pollIntervalMs?: number;
  overdueWindowMinutes?: number;
}

const LAST_CHECK_STORAGE_KEY = "post-reminder:last-check";
const MAX_CATCH_UP_WINDOW_MINUTES = 24 * 60;

function readLastCheckTimestamp(): number | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  const raw = window.localStorage.getItem(LAST_CHECK_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function writeLastCheckTimestamp(timestampMs: number): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(LAST_CHECK_STORAGE_KEY, String(timestampMs));
}

function toReminderPosts(posts: Post[]): ScheduledPostReminder[] {
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    caption: post.caption,
    scheduled_date: post.scheduled_date,
    scheduled_time: post.scheduled_time,
    user_id: post.user_id,
    status: post.status,
  }));
}

export function ScheduledPostNotifier({
  userId,
  initialPosts = [],
  pollIntervalMs = 60 * 1000,
  overdueWindowMinutes = 12,
}: ScheduledPostNotifierProps) {
  useEffect(() => {
    const initialReminderPosts = toReminderPosts(initialPosts);

    let intervalId: number | undefined;
    let disposed = false;
    let checking = false;

    const runCheck = async (posts?: ScheduledPostReminder[]) => {
      if (disposed || checking) {
        return;
      }
      checking = true;

      try {
        const nowMs = Date.now();
        const lastCheckMs = readLastCheckTimestamp();
        const elapsedMinutes =
          typeof lastCheckMs === "number"
            ? Math.max(1, Math.ceil((nowMs - lastCheckMs) / 60_000))
            : overdueWindowMinutes;
        const catchUpWindowMinutes = Math.max(
          overdueWindowMinutes,
          Math.min(MAX_CATCH_UP_WINDOW_MINUTES, elapsedMinutes + 1),
        );

        await checkScheduledPostsAndNotify({
          userId,
          posts,
          fetchPosts: fetchScheduledPostsForCurrentUser,
          overdueWindowMinutes: catchUpWindowMinutes,
          serviceWorkerPath: "/post-reminders-sw.js",
        });
        writeLastCheckTimestamp(nowMs);
      } catch (error) {
        // Keep the app resilient; reminder checks should never block UI.
        console.error("Scheduled post reminder check failed.", error);
      } finally {
        checking = false;
      }
    };

    // Use provided posts for immediate first-run reminders when available.
    // Otherwise fetch from API so reminders work outside dashboard too.
    if (initialReminderPosts.length > 0) {
      void runCheck(initialReminderPosts);
    } else {
      void runCheck();
    }

    const handleWindowFocus = () => {
      void runCheck();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runCheck();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    intervalId = window.setInterval(() => {
      // Poll from API for any newly scheduled posts without full refresh.
      void runCheck();
    }, pollIntervalMs);

    return () => {
      disposed = true;
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [initialPosts, overdueWindowMinutes, pollIntervalMs, userId]);

  return null;
}
