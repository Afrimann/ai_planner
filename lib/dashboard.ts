import type { CalendarEvent, DashboardMetric } from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  return [
    { id: "focus-hours", label: "Focus Hours", value: "26h", delta: "+12%" },
    { id: "tasks-completed", label: "Tasks Completed", value: "34", delta: "+6" },
    { id: "active-projects", label: "Active Projects", value: "5", delta: "Stable" },
  ];
}

export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  return [
    {
      id: "ev-1",
      title: "Product design review",
      startsAt: "2026-02-18T10:00:00.000Z",
      endsAt: "2026-02-18T11:00:00.000Z",
      location: "Zoom",
      notes: "Review the Q2 planning board.",
    },
    {
      id: "ev-2",
      title: "Engineering stand-up",
      startsAt: "2026-02-19T08:30:00.000Z",
      endsAt: "2026-02-19T09:00:00.000Z",
      location: "Huddle Room A",
      notes: "Share blockers and release timeline.",
    },
  ];
}
