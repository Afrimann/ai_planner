import { getUpcomingEvents } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/date";

export default async function CalendarPage() {
  const events = await getUpcomingEvents();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-slate-600">Your confirmed schedule for this week.</p>
      </header>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-medium">{event.title}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(event.startsAt)} - {formatDateTime(event.endsAt)}
                </td>
                <td className="px-4 py-3 text-slate-600">{event.location}</td>
                <td className="px-4 py-3 text-slate-500">{event.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
