"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { createAppointment, deleteAppointment } from "@/lib/actions/appointments";
import type { AppointmentWithProspect } from "@/lib/database.types";

interface ProspectOption {
  id: string;
  warehouse_name: string;
  dm_name: string | null;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATIONS = [15, 30, 45, 60, 90, 120];

const noopSubscribe = () => () => {};
// Dates render in the viewer's own time zone, which the server can't know —
// skip rendering until we're in the browser to avoid a hydration mismatch.
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function BookingForm({
  prospects,
  defaultDate,
  prefillProspectId,
  onClose,
  onBooked,
}: {
  prospects: ProspectOption[];
  defaultDate: Date;
  prefillProspectId: string | null;
  onClose: () => void;
  onBooked: (startsAt: Date) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    prefillProspectId && prospects.some((p) => p.id === prefillProspectId) ? prefillProspectId : null,
  );
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = prospects.find((p) => p.id === selectedId) ?? null;
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospects
      .filter((p) => `${p.warehouse_name} ${p.dm_name ?? ""}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [prospects, search]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId) {
      setError("Pick a prospect.");
      return;
    }
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime())) {
      setError("Pick a date and time.");
      return;
    }
    const fd = new FormData();
    fd.set("prospect_id", selectedId);
    fd.set("starts_at", startsAt.toISOString());
    fd.set("duration_minutes", duration);
    fd.set("notes", notes);
    startTransition(async () => {
      const res = await createAppointment(undefined, fd);
      if (res.error) {
        setError(res.error);
      } else {
        onBooked(startsAt);
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-slate-900 md:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Book an appointment</h2>

        <div>
          <label className={labelClass}>Who with?</label>
          {selected ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2.5 dark:border-slate-700">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{selected.warehouse_name}</p>
                {selected.dm_name && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{selected.dm_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="ml-2 shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by warehouse or contact name…"
                className={inputClass}
              />
              <div className="mt-2 space-y-1">
                {matches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left dark:border-slate-800"
                  >
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                      {p.warehouse_name}
                    </span>
                    {p.dm_name && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.dm_name}</span>
                    )}
                  </button>
                ))}
                {matches.length === 0 && (
                  <p className="py-2 text-center text-sm text-slate-400 dark:text-slate-500">
                    {prospects.length === 0 ? "No prospects yet — add one first." : "No prospects match."}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Duration</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d < 60 ? `${d} minutes` : d === 60 ? "1 hour" : `${d / 60} hours`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Where, what to cover, anything to remember…"
            className={inputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Booking…" : "Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CalendarView({
  appointments,
  prospects,
  showRep,
  initialProspectId,
}: {
  appointments: AppointmentWithProspect[];
  prospects: ProspectOption[];
  showRep: boolean;
  initialProspectId: string | null;
}) {
  const isClient = useIsClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(!!initialProspectId);
  const [, startTransition] = useTransition();

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithProspect[]>();
    for (const a of appointments) {
      const key = format(new Date(a.starts_at), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [appointments]);

  if (!isClient) {
    return <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading calendar…</p>;
  }

  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  const dayAppointments = byDay.get(format(selectedDay, "yyyy-MM-dd")) ?? [];

  function selectDay(day: Date) {
    setSelectedDay(day);
    if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
  }

  function remove(id: string) {
    if (!window.confirm("Cancel this appointment?")) return;
    startTransition(async () => {
      await deleteAppointment(id);
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Book
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{format(month, "MMMM yyyy")}</h2>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setMonth(startOfMonth(now));
                setSelectedDay(now);
              }}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              Today
            </button>
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const count = byDay.get(format(day, "yyyy-MM-dd"))?.length ?? 0;
            const selected = isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDay(day)}
                className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-sm ${
                  selected
                    ? "bg-blue-600 font-semibold text-white"
                    : isToday(day)
                      ? "font-semibold text-blue-600 ring-1 ring-blue-600 dark:text-blue-400"
                      : isSameMonth(day, month)
                        ? "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        : "text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-800"
                }`}
              >
                {format(day, "d")}
                <span className="flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={`size-1.5 rounded-full ${selected ? "bg-white" : "bg-blue-600"}`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {format(selectedDay, "EEEE, MMMM d")}
      </h2>

      {dayAppointments.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
          Nothing booked.
        </p>
      )}

      <div className="space-y-2">
        {dayAppointments.map((a) => {
          const start = new Date(a.starts_at);
          const end = new Date(start.getTime() + a.duration_minutes * 60000);
          return (
            <div
              key={a.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {format(start, "h:mm a")} – {format(end, "h:mm a")}
                </p>
                <Link
                  href={`/prospects/${a.prospect_id}`}
                  className="block truncate font-medium text-slate-900 hover:underline dark:text-white"
                >
                  {a.prospect?.warehouse_name ?? "Unknown prospect"}
                </Link>
                {a.prospect?.dm_name && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">with {a.prospect.dm_name}</p>
                )}
                {showRep && a.rep && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Rep: {a.rep.full_name}</p>
                )}
                {a.notes && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.notes}</p>}
              </div>
              <button
                type="button"
                aria-label="Cancel appointment"
                onClick={() => remove(a.id)}
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-slate-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {formOpen && (
        <BookingForm
          prospects={prospects}
          defaultDate={selectedDay}
          prefillProspectId={initialProspectId}
          onClose={() => setFormOpen(false)}
          onBooked={selectDay}
        />
      )}
    </>
  );
}
