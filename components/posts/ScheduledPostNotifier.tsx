"use client";

import { useEffect } from "react";

import type { Post } from "@/types";
import {
  checkScheduledPostsAndNotify,
  fetchScheduledPostsForCurrentUser,
  type ScheduledPostReminder,
} from "@/lib/notifications/post-schedule-notifier";

interface ScheduledPostNotifierProps {
  userId: string;
  initialPosts: Post[];
  pollIntervalMs?: number;
  overdueWindowMinutes?: number;
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
  initialPosts,
  pollIntervalMs = 60 * 1000,
  overdueWindowMinutes = 12,
}: ScheduledPostNotifierProps) {
  useEffect(() => {
    const initialReminderPosts = toReminderPosts(initialPosts);

    let intervalId: number | undefined;
    let disposed = false;

    const runCheck = async (posts?: ScheduledPostReminder[]) => {
      if (disposed) {
        return;
      }

      try {
        await checkScheduledPostsAndNotify({
          userId,
          posts,
          fetchPosts: fetchScheduledPostsForCurrentUser,
          overdueWindowMinutes,
          serviceWorkerPath: "/post-reminders-sw.js",
        });
      } catch (error) {
        // Keep the dashboard resilient; reminder checks should never block UI.
        console.error("Scheduled post reminder check failed.", error);
      }
    };

    // First run uses server-provided posts so reminders are immediate.
    void runCheck(initialReminderPosts);

    intervalId = window.setInterval(() => {
      // Poll from API for any newly scheduled posts without full refresh.
      void runCheck();
    }, pollIntervalMs);

    return () => {
      disposed = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [initialPosts, overdueWindowMinutes, pollIntervalMs, userId]);

  return null;
}
