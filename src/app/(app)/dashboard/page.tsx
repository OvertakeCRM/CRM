import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STAGES, STAGE_META, LOSS_REASON_META } from "@/lib/stages";
import {
  computeStageCounts,
  computeContainerVolume,
  computeStaleProspects,
  computeRecentlyWon,
  computeLossBreakdown,
  computeLeaderboard,
  computeWinRate,
} from "@/lib/dashboard";
import type { ActivityLogEntry, Prospect, Profile } from "@/lib/database.types";
import { formatCurrency } from "@/lib/format";

export const metadata = { title: "Dashboard — Overtake CRM" };

const cardClass = "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period = params.period === "month" ? "month" : "week";
  const supabase = await createClient();

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - (period === "month" ? 30 : 7));

  const [{ data: prospects }, { data: reps }, { data: settings }, { data: periodActivity }] = await Promise.all([
    supabase.from("prospects").select("*"),
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("app_settings").select("*").single(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("type", "stage_change")
      .gte("created_at", periodStart.toISOString()),
  ]);

  const all = (prospects ?? []) as Prospect[];
  const repList = (reps ?? []) as Profile[];
  const staleDays = settings?.stale_days ?? 14;
  const periodProspects = all.filter((p) => new Date(p.created_at).getTime() >= periodStart.getTime());

  const stageCounts = computeStageCounts(all);
  const volume = computeContainerVolume(all);
  const stale = computeStaleProspects(all, staleDays);
  const won = computeRecentlyWon(all);
  const lossBreakdown = computeLossBreakdown(all);
  const leaderboard = computeLeaderboard(repList, (periodActivity ?? []) as unknown as ActivityLogEntry[], periodProspects);
  const winRate = computeWinRate(all);
  const totalLost = Object.values(lossBreakdown).reduce((a, b) => a + b, 0);
  const maxStageCount = Math.max(1, ...Object.values(stageCounts));

  return (
    <div className="px-4 pb-10 pt-4 md:px-0">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Open prospects" value={all.filter((p) => p.stage !== "sold_won" && p.stage !== "lost").length} />
        <StatTile label="Win rate" value={`${winRate}%`} sub="won vs. closed" />
        <StatTile
          label="Containers/wk in pipeline"
          value={volume.inPipeline}
          sub={volume.revenueInPipeline > 0 ? `${formatCurrency(volume.revenueInPipeline)}/wk potential` : undefined}
        />
        <StatTile
          label="Containers/wk won"
          value={volume.won}
          sub={volume.revenueWon > 0 ? `${formatCurrency(volume.revenueWon)}/wk` : undefined}
        />
      </div>

      <div className={`mb-6 ${cardClass}`}>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Pipeline by stage</h2>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">
                {STAGE_META[stage].label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${STAGE_META[stage].dot}`}
                  style={{ width: `${(stageCounts[stage] / maxStageCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                {stageCounts[stage]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rep leaderboard</h2>
            <div className="flex gap-1 text-xs">
              <Link
                href="/dashboard?period=week"
                className={`rounded-full px-2 py-0.5 ${
                  period === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                Week
              </Link>
              <Link
                href="/dashboard?period=month"
                className={`rounded-full px-2 py-0.5 ${
                  period === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                Month
              </Link>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
                <th className="pb-1 font-medium">Rep</th>
                <th className="pb-1 font-medium">Added</th>
                <th className="pb-1 font-medium">Visited</th>
                <th className="pb-1 font-medium">Contacted</th>
                <th className="pb-1 font-medium">Won</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(({ rep, added, visited, contacted, won: wonCount }) => (
                <tr key={rep.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">{rep.full_name}</td>
                  <td className="py-1.5 text-slate-600 dark:text-slate-300">{added}</td>
                  <td className="py-1.5 text-slate-600 dark:text-slate-300">{visited}</td>
                  <td className="py-1.5 text-slate-600 dark:text-slate-300">{contacted}</td>
                  <td className="py-1.5 text-slate-600 dark:text-slate-300">{wonCount}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400 dark:text-slate-500">
                    No reps yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={cardClass}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Loss reasons ({totalLost} lost)</h2>
          <div className="space-y-2">
            {(Object.entries(lossBreakdown) as [keyof typeof lossBreakdown, number][]).map(([reason, count]) => (
              <div key={reason} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">
                  {LOSS_REASON_META[reason]}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-rose-400"
                    style={{ width: `${totalLost ? (count / totalLost) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cardClass}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recently won</h2>
          {won.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">Nothing won yet.</p>}
          <ul className="space-y-2">
            {won.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/prospects/${p.id}`}
                  className="text-sm font-medium text-slate-800 hover:underline dark:text-slate-200"
                >
                  {p.warehouse_name}
                </Link>
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                  {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Stale prospects{" "}
            <span className="font-normal text-slate-400 dark:text-slate-500">(no update in {staleDays}+ days)</span>
          </h2>
          {stale.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">Nothing stale. Nice work.</p>}
          <ul className="space-y-2">
            {stale.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/prospects/${p.id}`}
                  className="truncate text-sm font-medium text-slate-800 hover:underline dark:text-slate-200"
                >
                  {p.warehouse_name}
                </Link>
                <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">
                  {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
