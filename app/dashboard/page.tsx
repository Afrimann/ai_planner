import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { ScheduledPostNotifier } from "@/components/posts/ScheduledPostNotifier";

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    return (
      <section className="space-y-8">
        <ScheduledPostNotifier userId={data.user.id} initialPosts={data.posts} />

        <header>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">Overview of your workspace activity.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-gray-500">{m.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-400">{m.helper}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unauthorized")) {
      redirect("/auth/signin");
    }

    throw error;
  }
}
