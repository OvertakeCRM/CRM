import type { LossReason, Stage } from "@/lib/database.types";

export const STAGES: Stage[] = [
  "not_visited",
  "visited",
  "contacted",
  "decision_maker_engaged",
  "interested_qualified",
  "proposal_sent",
  "negotiating",
  "sold_won",
  "lost",
];

export const STAGE_META: Record<Stage, { label: string; short: string; color: string; dot: string }> = {
  not_visited: { label: "Not Visited", short: "New", color: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-400" },
  visited: { label: "Visited", short: "Visited", color: "bg-sky-100 text-sky-700 border-sky-300", dot: "bg-sky-500" },
  contacted: { label: "Contacted", short: "Contacted", color: "bg-indigo-100 text-indigo-700 border-indigo-300", dot: "bg-indigo-500" },
  decision_maker_engaged: { label: "Decision Maker Engaged", short: "DM Engaged", color: "bg-violet-100 text-violet-700 border-violet-300", dot: "bg-violet-500" },
  interested_qualified: { label: "Interested / Qualified", short: "Qualified", color: "bg-amber-100 text-amber-700 border-amber-300", dot: "bg-amber-500" },
  proposal_sent: { label: "Proposal / Quote Sent", short: "Proposal", color: "bg-orange-100 text-orange-700 border-orange-300", dot: "bg-orange-500" },
  negotiating: { label: "Negotiating", short: "Negotiating", color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300", dot: "bg-fuchsia-500" },
  sold_won: { label: "Sold / Won", short: "Won", color: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
  lost: { label: "Lost / Not Interested", short: "Lost", color: "bg-rose-100 text-rose-700 border-rose-300", dot: "bg-rose-500" },
};

export const OPEN_STAGES = STAGES.filter((s) => s !== "sold_won" && s !== "lost");

export const LOSS_REASON_META: Record<LossReason, string> = {
  price: "Price",
  competitor: "Went with competitor",
  no_need: "No need",
  bad_timing: "Bad timing",
  other: "Other",
};

// Map pin colors keyed by stage (used by the territory map view).
export const STAGE_PIN_COLOR: Record<Stage, string> = {
  not_visited: "#94a3b8",
  visited: "#0ea5e9",
  contacted: "#6366f1",
  decision_maker_engaged: "#8b5cf6",
  interested_qualified: "#f59e0b",
  proposal_sent: "#f97316",
  negotiating: "#d946ef",
  sold_won: "#10b981",
  lost: "#f43f5e",
};
