"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Navigation2 } from "lucide-react";
import { useGeolocation } from "@/lib/useGeolocation";
import { nearestNeighborOrder, googleMapsRouteUrl } from "@/lib/route";
import { formatDistanceKm, haversineKm } from "@/lib/geo";
import StageBadge from "@/components/StageBadge";
import type { ProspectWithRep } from "@/lib/database.types";

export default function RoutePlanner({ prospects }: { prospects: ProspectWithRep[] }) {
  const { status, coords, error, request } = useGeolocation();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(prospects.filter((p) => p.stage === "not_visited").map((p) => p.id)),
  );

  const selectedProspects = prospects.filter((p) => selected.has(p.id));

  const orderedProspects = useMemo(() => {
    if (!coords || selectedProspects.length === 0) return [];
    const ordered = nearestNeighborOrder(
      coords,
      selectedProspects.map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng! })),
    );
    return ordered.map((o) => selectedProspects.find((p) => p.id === o.id)!);
  }, [coords, selectedProspects]);

  const totalKm = useMemo(() => {
    if (!coords || orderedProspects.length === 0) return 0;
    let total = 0;
    let prev = coords;
    for (const stop of orderedProspects) {
      total += haversineKm(prev.lat, prev.lng, stop.lat!, stop.lng!);
      prev = { lat: stop.lat!, lng: stop.lng! };
    }
    return total;
  }, [coords, orderedProspects]);

  const mapsUrl = useMemo(() => {
    if (!coords || orderedProspects.length === 0) return null;
    return googleMapsRouteUrl(
      coords,
      orderedProspects.map((p) => ({ lat: p.lat!, lng: p.lng! })),
    );
  }, [coords, orderedProspects]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (prospects.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        No open prospects with a mapped address yet — add addresses via the Google Maps autocomplete to plan a route.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 space-y-2">
        {prospects.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              className="size-4 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{p.warehouse_name}</p>
              <p className="truncate text-xs text-slate-500">{p.address}</p>
            </div>
            <StageBadge stage={p.stage} />
          </label>
        ))}
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={request}
          disabled={selected.size === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Navigation2 size={16} />
          Plan route from my location ({selected.size} stop{selected.size === 1 ? "" : "s"})
        </button>
      )}

      {status === "loading" && <p className="text-center text-sm text-slate-400">Finding your location…</p>}
      {(status === "denied" || status === "error") && (
        <p className="text-center text-sm text-slate-400">{error}</p>
      )}

      {status === "granted" && orderedProspects.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-semibold text-blue-800">
            Suggested order · ~{formatDistanceKm(totalKm)} total (straight-line)
          </p>
          <ol className="mb-3 space-y-2">
            {orderedProspects.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{p.warehouse_name}</p>
                  <p className="truncate text-xs text-slate-500">{p.address}</p>
                </div>
              </li>
            ))}
          </ol>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open route in Google Maps
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
