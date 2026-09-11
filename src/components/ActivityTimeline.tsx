import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { STAGE_META } from "@/lib/stages";
import type { ActivityLogEntry } from "@/lib/database.types";

export type DisplayActivityEntry = ActivityLogEntry & { pending?: boolean };

export default function ActivityTimeline({ entries }: { entries: DisplayActivityEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <div
            className={`mt-1 size-2 shrink-0 rounded-full ${entry.pending ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-600"}`}
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">{entry.rep?.full_name ?? "Someone"}</span>
              <span className="text-slate-400 dark:text-slate-500">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </span>
              {entry.pending && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Clock size={10} /> Syncing
                </span>
              )}
            </div>

            {entry.type === "stage_change" && entry.new_stage && (
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                Moved{entry.old_stage ? ` from ${STAGE_META[entry.old_stage].label}` : ""} to{" "}
                <span className="font-medium">{STAGE_META[entry.new_stage].label}</span>
              </p>
            )}
            {entry.type === "quick_log" && (
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">{entry.note}</span>
              </p>
            )}
            {entry.type === "note" && entry.note && (
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{entry.note}</p>
            )}
            {entry.type === "stage_change" && entry.note && (
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-500 italic dark:text-slate-400">
                &ldquo;{entry.note}&rdquo;
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
