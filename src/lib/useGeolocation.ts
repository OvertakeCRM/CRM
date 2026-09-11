"use client";

import { useCallback, useState } from "react";

interface GeoState {
  status: "idle" | "loading" | "granted" | "denied" | "error";
  coords: { lat: number; lng: number } | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle", coords: null, error: null });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", coords: null, error: "Location isn't supported on this device." });
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        });
      },
      (err) => {
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          coords: null,
          error: err.code === err.PERMISSION_DENIED ? "Location access was denied." : "Couldn't get your location.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, request };
}
