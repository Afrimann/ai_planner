import { getDashboardMetrics, getUpcomingEvents } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/date";

export default async function DashboardPage() {
  const [metrics, events] = await Promise.all([getDashboardMetrics(), getUpcomingEvents()]);

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">Track priorities and team momentum.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-xs text-emerald-700">{metric.delta}</p>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-md border border-slate-100 p-3">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-slate-600">{formatDateTime(event.startsAt)} - {formatDateTime(event.endsAt)}</p>
              <p className="text-sm text-slate-500">{event.location}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
