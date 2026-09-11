import { haversineKm } from "@/lib/geo";

export interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
}

// Greedy nearest-neighbor ordering on straight-line distance. Not optimal
// (that's the NP-hard traveling salesman problem), but good enough for a
// handful of stops in a day, and free — no routing API calls.
export function nearestNeighborOrder<T extends RoutePoint>(
  start: { lat: number; lng: number },
  points: T[],
): T[] {
  const remaining = [...points];
  const ordered: T[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    remaining.forEach((point, index) => {
      const distance = haversineKm(current.lat, current.lng, point.lat, point.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

export function googleMapsRouteUrl(
  origin: { lat: number; lng: number },
  stops: { lat: number; lng: number }[],
): string | null {
  if (stops.length === 0) return null;
  const last = stops[stops.length - 1];
  const waypoints = stops
    .slice(0, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join("|");

  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${last.lat},${last.lng}`,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
