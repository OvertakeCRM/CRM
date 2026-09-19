import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Package, Phone, CalendarClock } from "lucide-react";
import StageBadge from "@/components/StageBadge";
import type { ProspectWithRep } from "@/lib/database.types";

function followUpClass(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr <= today) return "text-rose-600 dark:text-rose-400";
  return "text-amber-600 dark:text-amber-400";
}

export default function ProspectCard({ prospect, showRep }: { prospect: ProspectWithRep; showRep?: boolean }) {
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 dark:text-white">{prospect.warehouse_name}</h3>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{prospect.address}</p>
        </div>
        <StageBadge stage={prospect.stage} className="shrink-0" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
        {prospect.containers_per_week != null && (
          <span className="flex items-center gap-1">
            <Package size={14} /> {prospect.containers_per_week}/wk
          </span>
        )}
        {(prospect.dm_phone_cell || prospect.dm_phone_work) && (
          <span className="flex items-center gap-1">
            <Phone size={14} /> {prospect.dm_phone_cell || prospect.dm_phone_work}
          </span>
        )}
        {prospect.next_follow_up_date && (
          <span className={`flex items-center gap-1 font-medium ${followUpClass(prospect.next_follow_up_date)}`}>
            <CalendarClock size={14} /> {prospect.next_follow_up_date}
          </span>
        )}
        {showRep && prospect.assigned_rep && <span>· {prospect.assigned_rep.full_name}</span>}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          Updated {formatDistanceToNow(new Date(prospect.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
