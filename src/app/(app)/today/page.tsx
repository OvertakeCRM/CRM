import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { computeStaleProspects } from "@/lib/dashboard";
import StageBadge from "@/components/StageBadge";
import type { ActivityLogEntry, Prospect } from "@/lib/database.types";

export const metadata = { title: "Today — Overtake CRM" };

function followUpClass(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr <= today ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400";
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default async function TodayPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: mine }, { data: dueFollowUps }, { data: todayActivity }, { data: settings }] = await Promise.all([
    supabase.from("prospects").select("*").eq("assigned_rep_id", user.id),
    supabase
      .from("prospects")
      .select("*")
      .eq("assigned_rep_id", user.id)
      .not("next_follow_up_date", "is", null)
      .lte("next_follow_up_date", today)
      .not("stage", "in", "(sold_won,lost)")
      .order("next_follow_up_date", { ascending: true }),
    supabase
      .from("activity_log")
      .select("*")
      .eq("rep_id", user.id)
      .eq("type", "stage_change")
      .gte("created_at", startOfDay.toISOString()),
    supabase.from("app_settings").select("*").single(),
  ]);

  const myProspects = (mine ?? []) as Prospect[];
  const followUps = (dueFollowUps ?? []) as Prospect[];
  const activity = (todayActivity ?? []) as unknown as ActivityLogEntry[];
  const staleDays = settings?.stale_days ?? 14;
  const stale = computeStaleProspects(myProspects, staleDays).slice(0, 8);

  const addedToday = myProspects.filter((p) => new Date(p.created_at) >= startOfDay).length;
  const visitedToday = activity.filter((a) => a.new_stage === "visited").length;
  const contactedToday = activity.filter((a) => a.new_stage === "contacted").length;
  const wonToday = activity.filter((a) => a.new_stage === "sold_won").length;

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
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Your day so far</h2>
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Added" value={addedToday} />
          <StatTile label="Visited" value={visitedToday} />
          <StatTile label="Contacted" value={contactedToday} />
          <StatTile label="Won" value={wonToday} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Needs attention <span className="font-normal text-slate-400 dark:text-slate-500">(no update in {staleDays}+ days)</span>
        </h2>
        {stale.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Nothing stale. Nice work.
          </p>
        )}
        <div className="space-y-2">
          {stale.map((p) => (
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
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                </span>
                <StageBadge stage={p.stage} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
