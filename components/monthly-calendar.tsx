"use client";

import { useMemo, useState } from "react";

type CalendarPost = {
  id: string;
  title: string;
  scheduled_date: string;
};

interface MonthlyCalendarProps {
  posts: CalendarPost[];
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toReadableDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function MonthlyCalendar({ posts }: MonthlyCalendarProps) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const postsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarPost[]>();

    posts.forEach((post) => {
      const dateKey = post.scheduled_date;
      const existing = grouped.get(dateKey) ?? [];
      existing.push(post);
      grouped.set(dateKey, existing);
    });

    return grouped;
  }, [posts]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const dayOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - dayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      return current;
    });
  }, [visibleMonth]);

  const filteredPosts = useMemo(() => {
    if (!selectedDateKey) {
      return [];
    }

    return postsByDate.get(selectedDateKey) ?? [];
  }, [postsByDate, selectedDateKey]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            Previous
          </button>
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            Next
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase text-slate-500">
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((date) => {
            const dateKey = toDateKey(date);
            const count = postsByDate.get(dateKey)?.length ?? 0;
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const isSelected = selectedDateKey === dateKey;

            const dayClassName = isSelected
              ? "min-h-20 rounded-md border border-slate-900 bg-slate-900 p-2 text-left text-white"
              : `min-h-20 rounded-md border border-slate-200 p-2 text-left ${
                  isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                }`;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDateKey(dateKey)}
                className={dayClassName}
              >
                <p className="text-sm font-medium">{date.getDate()}</p>
                {count > 0 && (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      isSelected ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                    }`}
                  >
                    {count} post{count > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">
          {selectedDateKey ? `Posts for ${toReadableDate(selectedDateKey)}` : "Select a day to view posts"}
        </h3>
        {selectedDateKey && (
          <ul className="mt-3 space-y-2">
            {filteredPosts.length === 0 ? (
              <li className="text-sm text-slate-500">No posts scheduled for this date.</li>
            ) : (
              filteredPosts.map((post) => (
                <li key={post.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  {post.title}
                </li>
              ))
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
