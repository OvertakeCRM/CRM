"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __westmontGoogleMapsCallback?: () => void;
  }
}

let loadingPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    window.__westmontGoogleMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=__westmontGoogleMapsCallback&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export function useGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setLoadError("Couldn't load Google Maps."));
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const error = !apiKey ? "Google Maps API key is not configured." : loadError;

  return { ready, error };
}
