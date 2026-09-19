import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import NearbyProspects from "@/components/NearbyProspects";
import RoutePlanner from "@/components/RoutePlanner";
import StageBadge from "@/components/StageBadge";
import type { ProspectWithRep } from "@/lib/database.types";

export const metadata = { title: "Today — Overtake CRM" };

function followUpClass(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr <= today ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400";
}

export default async function TodayPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: open }, { data: dueFollowUps }] = await Promise.all([
    supabase
      .from("prospects")
      .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
      .eq("assigned_rep_id", user.id)
      .not("lat", "is", null)
      .not("stage", "in", "(sold_won,lost)"),
    supabase
      .from("prospects")
      .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
      .eq("assigned_rep_id", user.id)
      .not("next_follow_up_date", "is", null)
      .lte("next_follow_up_date", today)
      .order("next_follow_up_date", { ascending: true }),
  ]);

  const openProspects = (open ?? []) as unknown as ProspectWithRep[];
  const followUps = (dueFollowUps ?? []) as unknown as ProspectWithRep[];

  return (
    <div className="px-4 pb-8 pt-4 md:px-0">
      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Today</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Due for follow-up {followUps.length > 0 && `(${followUps.length})`}
        </h2>
        {followUps.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Nothing due. Nice work.
          </p>
        )}
        <div className="space-y-2">
          {followUps.map((p) => (
            <Link
              key={p.id}
              href={`/prospects/${p.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{p.warehouse_name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.address}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-semibold ${followUpClass(p.next_follow_up_date!)}`}>
                  {p.next_follow_up_date}
                </span>
                <StageBadge stage={p.stage} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Nearby</h2>
        <NearbyProspects prospects={openProspects} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Plan your route</h2>
        <RoutePlanner prospects={openProspects} />
      </section>
    </div>
  );
}
