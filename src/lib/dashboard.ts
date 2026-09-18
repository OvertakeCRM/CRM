import "server-only";
import { STAGES, LOSS_REASON_META } from "@/lib/stages";
import type { ActivityLogEntry, LossReason, Prospect, Profile, Stage } from "@/lib/database.types";

export function computeStageCounts(prospects: Prospect[]) {
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const p of prospects) counts[p.stage]++;
  return counts;
}

export function computeContainerVolume(prospects: Prospect[]) {
  let inPipeline = 0;
  let won = 0;
  let revenueInPipeline = 0;
  let revenueWon = 0;
  for (const p of prospects) {
    const c = p.containers_per_week ?? 0;
    const revenue = c * (p.price_per_container ?? 0);
    if (p.stage === "sold_won") {
      won += c;
      revenueWon += revenue;
    } else if (p.stage !== "lost") {
      inPipeline += c;
      revenueInPipeline += revenue;
    }
  }
  return { inPipeline, won, revenueInPipeline, revenueWon };
}

export function computeStaleProspects(prospects: Prospect[], staleDays: number) {
  const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  return prospects
    .filter((p) => p.stage !== "sold_won" && p.stage !== "lost" && new Date(p.updated_at).getTime() < cutoff)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
}

export function computeRecentlyWon(prospects: Prospect[], limit = 5) {
  return [...prospects]
    .filter((p) => p.stage === "sold_won")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}

export function computeLossBreakdown(prospects: Prospect[]) {
  const counts = {} as Record<LossReason, number>;
  for (const key of Object.keys(LOSS_REASON_META) as LossReason[]) counts[key] = 0;
  for (const p of prospects) {
    if (p.stage === "lost" && p.loss_reason) counts[p.loss_reason]++;
  }
  return counts;
}

export function computeLeaderboard(
  reps: Profile[],
  periodActivity: ActivityLogEntry[],
  periodProspects: Prospect[] = [],
) {
  return reps
    .map((rep) => {
      const mine = periodActivity.filter((a) => a.rep_id === rep.id);
      return {
        rep,
        added: periodProspects.filter((p) => p.created_by === rep.id).length,
        visited: mine.filter((a) => a.new_stage === "visited").length,
        contacted: mine.filter((a) => a.new_stage === "contacted").length,
        won: mine.filter((a) => a.new_stage === "sold_won").length,
        activityCount: mine.length,
      };
    })
    .sort((a, b) => b.activityCount - a.activityCount);
}

export function computeWinRate(prospects: Prospect[]) {
  const closed = prospects.filter((p) => p.stage === "sold_won" || p.stage === "lost");
  if (closed.length === 0) return 0;
  const won = closed.filter((p) => p.stage === "sold_won").length;
  return Math.round((won / closed.length) * 100);
}
