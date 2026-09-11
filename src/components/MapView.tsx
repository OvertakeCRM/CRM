"use client";

import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/lib/useGoogleMaps";
import { STAGE_META, STAGE_PIN_COLOR } from "@/lib/stages";
import type { ProspectWithRep } from "@/lib/database.types";

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#14532d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
];

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

export default function MapView({ prospects }: { prospects: ProspectWithRep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ready, error } = useGoogleMaps();

  const plottable = prospects.filter((p) => p.lat != null && p.lng != null);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google) return;

    const map = new google.maps.Map(containerRef.current, {
      center: plottable[0] ? { lat: plottable[0].lat!, lng: plottable[0].lng! } : { lat: 39.8283, lng: -98.5795 },
      zoom: plottable.length ? 9 : 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: isDarkMode() ? DARK_MAP_STYLES : undefined,
    });

    // The map is created once; watch for theme toggles afterward and restyle live.
    const observer = new MutationObserver(() => {
      map.setOptions({ styles: isDarkMode() ? DARK_MAP_STYLES : undefined });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    plottable.forEach((p) => {
      const position = { lat: p.lat!, lng: p.lng! };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: p.warehouse_name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: STAGE_PIN_COLOR[p.stage],
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 9,
        },
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="min-width:180px">
            <p style="font-weight:600;margin:0 0 2px">${p.warehouse_name}</p>
            <p style="margin:0 0 2px;color:#64748b;font-size:12px">${p.address}</p>
            <p style="margin:0 0 6px;font-size:12px">${STAGE_META[p.stage].label}</p>
            <a href="/prospects/${p.id}" style="color:#2563eb;font-size:12px;font-weight:600">View prospect →</a>
          </div>
        `);
        infoWindow.open({ map, anchor: marker });
      });
    });

    if (plottable.length > 1) map.fitBounds(bounds);
    else if (plottable.length === 1) map.setCenter(bounds.getCenter());

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, prospects]);

  if (error) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="h-[calc(100vh-160px)] w-full md:h-[600px] md:rounded-xl" />
      {prospects.length > plottable.length && (
        <p className="mt-2 px-4 text-xs text-slate-400 dark:text-slate-500 md:px-0">
          {prospects.length - plottable.length} prospect(s) don&apos;t have a mapped address yet.
        </p>
      )}
    </div>
  );
}
