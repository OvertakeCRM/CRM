"use client";

import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/lib/useGoogleMaps";

export default function AddressAutocomplete({
  defaultValue,
  onSelect,
}: {
  defaultValue?: string;
  onSelect: (result: { address: string; lat: number | null; lng: number | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ready, error } = useGoogleMaps();

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
      types: ["establishment", "geocode"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address ?? inputRef.current?.value ?? "";
      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;
      onSelect({ address, lat, lng });
    });

    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div>
      <input
        ref={inputRef}
        name="address"
        type="text"
        required
        defaultValue={defaultValue}
        onBlur={(e) => {
          // If they typed an address without picking a suggestion, still save the raw text.
          if (!window.google) onSelect({ address: e.target.value, lat: null, lng: null });
        }}
        placeholder="Start typing an address…"
        autoComplete="off"
        onKeyDown={(e) => {
          // Enter should accept the highlighted Google suggestion, not
          // submit the surrounding form — Google's own listener on this
          // input still handles the actual selection.
          if (e.key === "Enter") e.preventDefault();
        }}
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      {error && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Map autocomplete unavailable — you can still type the address.
        </p>
      )}
    </div>
  );
}
