import { MonthlyCalendar } from "@/components/monthly-calendar";
import { listPostsForAuthenticatedUser } from "@/lib/posts";

export default async function CalendarPage() {
  const posts = await listPostsForAuthenticatedUser();

  const scheduledPosts = posts.map((post) => ({
    id: post.id,
    title: post.title || "",
    // prefer the user-provided scheduled date when available
    scheduled_date: post.scheduled_date ?? post.created_at.slice(0, 10),
  }));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-slate-600">
          View posts by date and quickly filter the day&apos;s schedule.
        </p>
      </header>
      <MonthlyCalendar posts={scheduledPosts} />
    </section>
  );
}
