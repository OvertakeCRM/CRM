"use client";

import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { useIsClient } from "@/lib/useIsClient";
import type { AppointmentWithProspect } from "@/lib/database.types";

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

export default function UpcomingAppointments({
  appointments,
}: {
  appointments: Omit<AppointmentWithProspect, "rep">[];
}) {
  const isClient = useIsClient();

  if (!isClient) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>;
  }

  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        No upcoming appointments.{" "}
        <Link href="/calendar" className="font-medium text-blue-600 dark:text-blue-400">
          Book one
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((a) => {
        const start = new Date(a.starts_at);
        return (
          <Link
            key={a.id}
            href={`/prospects/${a.prospect_id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {a.prospect?.warehouse_name ?? "Unknown prospect"}
              </p>
              {a.prospect?.dm_name && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">with {a.prospect.dm_name}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-xs font-semibold ${
                  isToday(start) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {dayLabel(start)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{format(start, "h:mm a")}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
