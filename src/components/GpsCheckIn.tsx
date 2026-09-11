"use client";

import { useState, useTransition } from "react";
import { Navigation2, CheckCircle2 } from "lucide-react";
import { useGeolocation } from "@/lib/useGeolocation";
import { haversineKm, formatDistanceKm, CHECK_IN_RADIUS_KM } from "@/lib/geo";
import { changeStageClient } from "@/lib/offlineActions";
import type { Stage } from "@/lib/database.types";

export default function GpsCheckIn({
  prospectId,
  lat,
  lng,
  stage,
  onStageChange,
}: {
  prospectId: string;
  lat: number;
  lng: number;
  stage: Stage;
  onStageChange?: (stage: Stage, note: string | undefined, queued: boolean, id: string) => void;
}) {
  const { status, coords, error, request } = useGeolocation();
  const [isPending, startTransition] = useTransition();
  const [checkedIn, setCheckedIn] = useState(false);

  const distanceKm = coords ? haversineKm(coords.lat, coords.lng, lat, lng) : null;
  const isHere = distanceKm != null && distanceKm <= CHECK_IN_RADIUS_KM;

  function markVisited() {
    startTransition(async () => {
      const { queued, id } = await changeStageClient(prospectId, "visited", "GPS check-in");
      onStageChange?.("visited", "GPS check-in", queued, id);
      setCheckedIn(true);
    });
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={request}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        <Navigation2 size={15} />
        Check distance to this warehouse
      </button>
    );
  }

  if (status === "loading") {
    return <p className="text-center text-sm text-slate-400 dark:text-slate-500">Finding your location…</p>;
  }

  if (status === "denied" || status === "error") {
    return <p className="text-center text-sm text-slate-400 dark:text-slate-500">{error}</p>;
  }

  if (isHere && stage === "not_visited" && !checkedIn) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950">
        <p className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">You&apos;re here — mark as Visited?</p>
        <button
          type="button"
          onClick={markVisited}
          disabled={isPending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Mark as Visited"}
        </button>
      </div>
    );
  }

  if (isHere || checkedIn) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={15} /> You&apos;re at this location
      </p>
    );
  }

  return distanceKm != null ? (
    <p className="text-center text-sm text-slate-400 dark:text-slate-500">~{formatDistanceKm(distanceKm)} away (straight-line)</p>
  ) : null;
}
