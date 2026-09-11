"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navigation2 } from "lucide-react";
import { useGeolocation } from "@/lib/useGeolocation";
import { haversineKm, formatDistanceKm, NEARBY_RADIUS_KM } from "@/lib/geo";
import type { ProspectWithRep } from "@/lib/database.types";

interface NearbyItem {
  prospect: ProspectWithRep;
  distanceKm: number;
}

export default function NearbyProspects({ prospects }: { prospects: ProspectWithRep[] }) {
  const { status, coords, error, request } = useGeolocation();
  const [expanded, setExpanded] = useState(false);

  const nearby = useMemo<NearbyItem[]>(() => {
    if (!coords) return [];
    return prospects
      .filter((p) => p.lat != null && p.lng != null && p.stage !== "sold_won" && p.stage !== "lost")
      .map((p) => ({ prospect: p, distanceKm: haversineKm(coords.lat, coords.lng, p.lat!, p.lng!) }))
      .filter((x) => x.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [coords, prospects]);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={request}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
      >
        <Navigation2 size={16} />
        Find warehouses near me
      </button>
    );
  }

  if (status === "loading") {
    return <p className="mb-4 text-center text-sm text-slate-400 dark:text-slate-500">Finding your location…</p>;
  }

  if (status === "denied" || status === "error") {
    return <p className="mb-4 text-center text-sm text-slate-400 dark:text-slate-500">{error}</p>;
  }

  if (nearby.length === 0) {
    return (
      <p className="mb-4 text-center text-sm text-slate-400 dark:text-slate-500">
        No open prospects with a mapped address within {NEARBY_RADIUS_KM} km of you.
      </p>
    );
  }

  const shown = expanded ? nearby : nearby.slice(0, 3);

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
      <p className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
        {nearby.length} warehouse{nearby.length === 1 ? "" : "s"} near you
      </p>
      <div className="space-y-1.5">
        {shown.map(({ prospect, distanceKm }) => (
          <Link
            key={prospect.id}
            href={`/prospects/${prospect.id}`}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            <span className="truncate font-medium text-slate-800 dark:text-slate-200">{prospect.warehouse_name}</span>
            <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDistanceKm(distanceKm)}</span>
          </Link>
        ))}
      </div>
      {nearby.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300"
        >
          {expanded ? "Show less" : `Show ${nearby.length - 3} more`}
        </button>
      )}
    </div>
  );
}
