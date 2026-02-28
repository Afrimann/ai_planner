import { CopyCaptionButton } from "@/components/copy-caption-button";
import { listTodayPosts, listUpcomingPosts } from "@/lib/posts";

function PostCard({
  title,
  scheduledDate,
  caption,
  imageUrl,
}: {
  title: string;
  scheduledDate: string | null;
  caption: string;
  imageUrl: string | null;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-slate-500">Scheduled: {scheduledDate ?? "Not scheduled"}</p>
        </div>
        <CopyCaptionButton caption={caption} />
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{caption}</p>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Preview for ${title}`}
          className="mt-4 h-44 w-full rounded-md border border-slate-200 object-cover"
        />
      ) : null}
    </article>
  );
}

export default async function DashboardPage() {
  const [todayPosts, upcomingPosts] = await Promise.all([listTodayPosts(), listUpcomingPosts()]);

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">Review today&apos;s posts and what&apos;s scheduled next.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Today&apos;s posts</h2>
        {todayPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-slate-600">
            No posts scheduled for today.
          </p>
        ) : (
          <div className="grid gap-4">
            {todayPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                scheduledDate={post.scheduled_date}
                caption={post.caption ?? post.body}
                imageUrl={post.image_url}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Upcoming (next 7 days)</h2>
        {upcomingPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-slate-600">
            No upcoming posts in the next 7 days.
          </p>
        ) : (
          <div className="grid gap-4">
            {upcomingPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                scheduledDate={post.scheduled_date}
                caption={post.caption ?? post.body}
                imageUrl={post.image_url}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
